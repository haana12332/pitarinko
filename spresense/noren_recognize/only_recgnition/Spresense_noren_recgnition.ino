#include <Camera.h>
#include <SPI.h>
#include <EEPROM.h>
#include <DNNRT.h>
#include "Adafruit_ILI9341.h"
#include <SDHCI.h>
#include <vector>
#include <algorithm>

SDClass theSD;

/* LCD Settings */
#define TFT_RST 8
#define TFT_DC  9
#define TFT_CS  10

// 画像やモデルの設定
#define DNN_IMG_W 56 // ニューラルネットワーク入力画像の幅
#define DNN_IMG_H 56 // ニューラルネットワーク入力画像の高さ
#define CAM_IMG_W 320 // カメラ画像の幅
#define CAM_IMG_H 240 // カメラ画像の高さ
#define CAM_CLIP_X 48 // 画像の切り取り開始X座標
#define CAM_CLIP_Y 8 // 画像の切り取り開始Y座標
#define CAM_CLIP_W 224 // 画像の切り取り幅
#define CAM_CLIP_H 224 // 画像の切り取り高さ

#define LINE_THICKNESS 1 // ボックスの線の太さ

Adafruit_ILI9341 tft = Adafruit_ILI9341(&SPI, TFT_DC, TFT_CS, TFT_RST); // TFTディスプレイの設定

uint8_t buf[DNN_IMG_W*DNN_IMG_H]; // DNN入力用のバッファ

DNNRT dnnrt; // DNNランタイムのインスタンス
DNNVariable input(DNN_IMG_W*DNN_IMG_H); // DNNの入力変数

static uint8_t const label[3] = {0, 1, 2}; // ラベルの定義

std::vector<int> indexBuffer; // 1秒間のインデックスデータを格納するバッファ
unsigned long lastTime = 0;   // 最後にデータをチェックした時間

// テキストをLCDに表示する関数
void putStringOnLcd(String str, int color) {
    int len = str.length();
    tft.fillRect(0, 224, 320, 240, ILI9341_BLACK); // 画面の一部を黒で塗りつぶす
    tft.setTextSize(2);
    int sx = 160 - len / 2 * 12; // テキストの表示開始位置を計算
    if (sx < 0) sx = 0;
    tft.setCursor(sx, 225);
    tft.setTextColor(color);
    tft.println(str);
}

// 最頻値を求める関数
int calculateMode(const std::vector<int>& data) {
    if (data.empty()) return -1; // データがない場合は-1を返す

    std::vector<int> sortedData = data;
    std::sort(sortedData.begin(), sortedData.end());

    int mode = sortedData[0];
    int maxCount = 1;
    int currentCount = 1;

    for (size_t i = 1; i < sortedData.size(); ++i) {
        if (sortedData[i] == sortedData[i - 1]) {
            currentCount++;
        } else {
            if (currentCount > maxCount) {
                maxCount = currentCount;
                mode = sortedData[i - 1];
            }
            currentCount = 1;
        }
    }
    // 最後の要素を確認
    if (currentCount > maxCount) {
        mode = sortedData.back();
    }

    return mode;
}

// 推論結果のインデックスをバッファに追加する関数
void addIndexToBuffer(int index) {
    indexBuffer.push_back(index);

    unsigned long currentTime = millis();
    if (currentTime - lastTime >=3500) { // 1秒経過したら最頻値を計算
        int modeIndex = calculateMode(indexBuffer);
        // Serial.print("1秒間の最頻値: ");
        // Serial.println(modeIndex);
        if(modeIndex != 0){
          // 最頻値をPOSTリクエストで送信
          postData(modeIndex);
        }
        // バッファをクリア
        indexBuffer.clear();
        lastTime = currentTime;
    }
}

// POSTリクエストを送信する関数
void postData(int index) {
    // ここにPOSTリクエストのコードを実装する
    Serial.print("POST Data: ");
    Serial.println(index);
}

// カメラ画像に赤いボックスを描画する関数
void drawBox(uint16_t* imgBuf) {
    // 上下の線を描画
    for (int x = CAM_CLIP_X; x < CAM_CLIP_X + CAM_CLIP_W; ++x) {
        for (int n = 0; n < LINE_THICKNESS; ++n) {
            *(imgBuf + CAM_IMG_W * (CAM_CLIP_Y + n) + x) = ILI9341_RED; // 上線
            *(imgBuf + CAM_IMG_W * ((CAM_CLIP_Y + CAM_CLIP_H) / 2 + n) + x) = ILI9341_RED; // x軸中央線
            *(imgBuf + CAM_IMG_W * (CAM_CLIP_Y + CAM_CLIP_H - 1 - n) + x) = ILI9341_RED; // 下線
        }
    }
    // 左右の線を描画
    for (int y = CAM_CLIP_Y; y < CAM_CLIP_Y + CAM_CLIP_H; ++y) {
        for (int n = 0; n < LINE_THICKNESS; ++n) {
            *(imgBuf + CAM_IMG_W * y + CAM_CLIP_X + n) = ILI9341_RED; // 左線
            *(imgBuf + CAM_IMG_W * y + CAM_CLIP_X + (CAM_CLIP_W / 2) + n) = ILI9341_RED; // y軸中央線
            *(imgBuf + CAM_IMG_W * y + CAM_CLIP_X + CAM_CLIP_W - 1 - n) = ILI9341_RED; // 右線
        }
    }
}

// カメラ画像を取得したときに呼ばれるコールバック関数
void CamCB(CamImage img) {
    if (!img.isAvailable()) {
        Serial.println("Image is not available. Try again");
        return;
    }

    // 画像を指定された範囲で切り取りリサイズする
    CamImage small;
    CamErr err = img.clipAndResizeImageByHW(small, CAM_CLIP_X, CAM_CLIP_Y,
                                            CAM_CLIP_X + CAM_CLIP_W - 1,
                                            CAM_CLIP_Y + CAM_CLIP_H - 1,
                                            DNN_IMG_W, DNN_IMG_H);
    if (!small.isAvailable()) {
        putStringOnLcd("Clip and Resize Error:" + String(err), ILI9341_RED);
        return;
    }

    // 画像をRGB565形式に変換
    small.convertPixFormat(CAM_IMAGE_PIX_FMT_RGB565);
    uint16_t* tmp = (uint16_t*)small.getImgBuff();

    // DNN入力データの準備と正規化処理
    float* dnnbuf = input.data();
    float f_max = 0.0;
    for (int i = 0; i < DNN_IMG_H; ++i) {
        for (int j = 0; j < DNN_IMG_W; ++j) {
            int index = i * DNN_IMG_W + j;
            dnnbuf[index] = (float)((tmp[index] & 0xff00) >> 8);
            if (dnnbuf[index] > f_max) f_max = dnnbuf[index];
        }
    }

    // 正規化
    for (int n = 0; n < DNN_IMG_W * DNN_IMG_H; ++n) {
        dnnbuf[n] /= f_max;
    }

    // 推論結果を格納するための変数
    String gStrResult = "?";
    dnnrt.inputVariable(input, 0);
    dnnrt.forward();
    DNNVariable output = dnnrt.outputVariable(0);
    int index = output.maxIndex();

    if (index < 3) {
        gStrResult = String(label[index]) + String(":") + String(output[index]);
        // インデックスをバッファに追加
        addIndexToBuffer(index);
    } else {
        gStrResult = String("?:") + String(output[index]);
    }
    Serial.println(gStrResult);

    img.convertPixFormat(CAM_IMAGE_PIX_FMT_RGB565);
    uint16_t* imgBuf = (uint16_t*)img.getImgBuff();

    drawBox(imgBuf);
    tft.drawRGBBitmap(0, 0, (uint16_t*)img.getImgBuff(), 320, 224);
    putStringOnLcd(gStrResult, ILI9341_YELLOW);
}

void setup() {
    Serial.begin(115200);
    while (!Serial) {
        ;
    }
    Serial.println("Serial communication initialized.");
    while (!theSD.begin()) {
        putStringOnLcd("Insert SD card", ILI9341_RED);
    }

    File nnbfile = theSD.open("model.nnb");

    int ret = dnnrt.begin(nnbfile);
    if (ret < 0) {
        Serial.println("SD card initialized. Model loading result: " + String(ret));
        putStringOnLcd("dnnrt.begin failed" + String(ret), ILI9341_RED);
        return;
    }
    Serial.println("SD card initialized.");


    tft.begin();
    tft.setRotation(3);
    Serial.println("TFT initialized.");



    theCamera.begin();
    Serial.println("Camera initialized.");


    bool streamingStarted = theCamera.startStreaming(true, CamCB);
    if (!streamingStarted) {
        Serial.println("Failed to start camera streaming");
        putStringOnLcd("Streaming Failed", ILI9341_RED);
    } else {
        Serial.println("Camera streaming started successfully");
    }

    Serial.println("set up all green");
}

void loop() {
    // メインループの処理は特になし
}
