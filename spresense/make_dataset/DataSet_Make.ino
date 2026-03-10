#include <Camera.h>
#include <SDHCI.h>
#include <SPI.h>
#include "Adafruit_GFX.h"
#include "Adafruit_ILI9341.h"

// TFTモニタのピン設定
#define TFT_RST 8
#define TFT_DC  9
#define TFT_CS  10

#define CAM_IMG_W 320
#define CAM_IMG_H 240
#define CAM_CLIP_X 48  // 左上のX座標
#define CAM_CLIP_Y 8   // 左上のY座標
#define CAM_CLIP_W 223  // 幅を広げる
#define CAM_CLIP_H 223 // 高さはそのまま


Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);
SDClass theSD;

// ボタンとLEDのピン設定
const int button4Pin = 4;  // 写真撮影用ボタン
const int button5Pin = 5;  // 表示停止ボタン
const int led0Pin = LED_BUILTIN;  // LEDピン（動作確認用）

// ボタンのフラグ
volatile bool bButtonPressed = false;  // 4番ピンのボタンフラグ
volatile bool aButtonPressed = false;  // 5番ピンのボタンフラグ

// 撮影した画像のカウンタ（ファイル名生成用）
int gCounter = 0;
bool displayImage = false;  // 撮影した画像を表示中かどうか

// 4番ピンの割り込みハンドラ
void change4State() {
  bButtonPressed = true;
}

// 5番ピンの割り込みハンドラ
void change5State() {
  aButtonPressed = true;
}

// 赤い枠を描画する関数
void drawRedFrame() {
  // 赤枠を描画
  tft.drawRect(CAM_CLIP_X, CAM_CLIP_Y, CAM_CLIP_W, CAM_CLIP_H, ILI9341_RED);

  // 枠の中心のX座標とY座標を計算
  int centerX = CAM_CLIP_X + CAM_CLIP_W / 2;
  int centerY = CAM_CLIP_Y + CAM_CLIP_H / 2;

  // 水平線を描画
  tft.drawLine(CAM_CLIP_X, centerY, CAM_CLIP_X + CAM_CLIP_W, centerY, ILI9341_RED);

  // 垂直線を描画
  tft.drawLine(centerX, CAM_CLIP_Y, centerX, CAM_CLIP_Y + CAM_CLIP_H, ILI9341_RED);
}

// カメラ画像をTFTモニタに表示するコールバック関数
void CamCB(CamImage img) {
  if (img.isAvailable() && !displayImage) {  // 撮影画像が表示されていない場合のみ実行
    img.convertPixFormat(CAM_IMAGE_PIX_FMT_RGB565);
    tft.drawRGBBitmap(0, 0, (uint16_t*)img.getImgBuff(), 320, 240);
    drawRedFrame();  // 画像の上に赤い枠を描画
  }
}
void setup() {
  // シリアル通信の初期化
  Serial.begin(115200);
  while (!Serial) {
    ; // シリアル通信の準備ができるまで待機
  }
  Serial.println("Serial communication initialized.");

  // SDカードの初期化
  if (!theSD.begin()) {
    Serial.println("SD card initialization failed!");
    return;  // SDカードの初期化に失敗した場合は、以降の処理を中止
  }
  Serial.println("SD card initialized.");  // SDカード初期化確認用メッセージ

  // TFTディスプレイの初期化と回転設定
  tft.begin();
  tft.setRotation(3);
  Serial.println("TFT initialized.");  // TFT初期化確認用メッセージ

  // カメラの初期化
  theCamera.begin();
  Serial.println("Camera initialized.");  // カメラ初期化確認用メッセージ

  // ボタンとLEDピンの設定
  pinMode(led0Pin, OUTPUT);
  pinMode(button4Pin, INPUT_PULLUP);
  pinMode(button5Pin, INPUT_PULLUP);

  // 割り込み設定
  attachInterrupt(digitalPinToInterrupt(button4Pin), change4State, FALLING);
  attachInterrupt(digitalPinToInterrupt(button5Pin), change5State, FALLING);

  // ストリーミング開始（カメラ映像をTFTに表示）
  theCamera.startStreaming(true, CamCB);
  // カメラの画像フォーマットをYUV422に設定
  theCamera.setStillPictureImageFormat(320, 240, CAM_IMAGE_PIX_FMT_YUV422);
  drawRedFrame();  // ストリーミング中にも赤い枠を表示
}
int test=0;
void loop() {
  if (test==0){
    Serial.println("start");
    test+=1;
  }
  // 4番ボタンが押された場合の処理（写真を撮影して表示）
  if (bButtonPressed) {
    Serial.println("4 button pressed");
    Serial.println("gCounter: "+gCounter);

    // LEDを点灯（撮影中）
    digitalWrite(led0Pin, HIGH);

    // ストリーミングを一時停止し、写真を撮影
    theCamera.startStreaming(false, CamCB);
    CamImage img = theCamera.takePicture();
  
    if (!img.isAvailable()) {
      Serial.println("Failed to take picture");
      digitalWrite(led0Pin, LOW);  // LEDを消灯
      bButtonPressed = false;  // フラグをリセット
      return;
    }

    // 画像に赤枠を描画して表示
    Serial.println("isAvailable");

    // 出力先の画像を準備する
    CamImage small;
    int x_start = CAM_CLIP_X;
    int y_start = CAM_CLIP_Y;
    int x_end = CAM_CLIP_X + CAM_CLIP_W ;
    int y_end = CAM_CLIP_Y + CAM_CLIP_H ;
    Serial.print("Clip Coordinates: ");
    Serial.print(x_start);
    Serial.print(", ");
    Serial.print(y_start);
    Serial.print(", ");
    Serial.print(x_end);
    Serial.print(", ");
    Serial.println(y_end);
    Serial.println("w : " + String(img.getWidth()) + " h : " + String(img.getHeight()));
    // クリップとリサイズ
    CamErr err = img.clipAndResizeImageByHW(small,x_start,y_start,x_end,y_end,56,56);
    if (err) {
        Serial.println("ERROR: "+String(err));
        return;
    }
    if (!small.isAvailable()){
      Serial.println("clipAndResize failed");
      return;
    }

    // SDカードに保存
    char filename[16] = {0};
    // SDカードに保存

    sprintf(filename, "rsize%03d.pgm", gCounter); // gCounterを使ってユニークなファイル名を生成

    
    File myFile = theSD.open(filename, FILE_WRITE);
    if (myFile) {
      myFile.println("P5");  // ヘッダー
      myFile.println("56 56");  // サイズ
      myFile.println("255");  // 最大値
      myFile.write("\n");  // ヘッダーとデータの間に改行を一つ追加（重要）

      uint16_t* buf = (uint16_t*)small.getImgBuff();

      for (int i = 0; i < 56 ; ++i) {
          for (int j = 0; j < 56 ; ++j) {
              uint8_t val = (uint8_t)((*buf & 0xff00) >> 8);
              myFile.write(val);
              ++buf;
          }
      }
      myFile.close();
      Serial.println("Image saved successfully.");
      ++gCounter; // カウンタをインクリメント
    } else {
      Serial.println("Failed to open file for writing");
    }

    displayImage = true;  // 画像を表示中フラグをセット

    // フラグとLEDの状態をリセット
    bButtonPressed = false;
    digitalWrite(led0Pin, LOW);
  }

  // 5番ボタンが押された場合の処理（画像表示を停止し、ストリーミングを再開）
  if (aButtonPressed) {
    Serial.println("5 button pressed");

    // 画面をクリアし、ストリーミングを再開
    tft.fillScreen(ILI9341_BLACK);  // 画面を黒でクリア
    drawRedFrame();  // 画面クリア後に赤い枠を描画
    theCamera.startStreaming(true, CamCB);  // ストリーミング再開

    displayImage = false;  // 画像表示中フラグをリセット
    aButtonPressed = false;  // フラグをリセット
  }
}
