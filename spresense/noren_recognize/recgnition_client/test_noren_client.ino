#include <HttpGs2200.h> // GS2200のHTTP機能を操作するライブラリをインクルード
#include <TelitWiFi.h>  // GS2200 Wi-Fiモジュールの基本的な機能を操作するライブラリをインクルード
#include "config.h"     // ユーザー定義の設定を含むヘッダーファイルをインクルード
//画像表示のライブラリ
#include "SPI.h"
#include "Adafruit_GFX.h"
#include "Adafruit_ILI9341.h"

//暖簾用
#include <Camera.h>
#include <EEPROM.h>
#include <DNNRT.h>
#include "Adafruit_ILI9341.h"
#include <SDHCI.h>
#include <vector>
#include <algorithm>

SDClass theSD;
#define LINE_THICKNESS 1 // ボックスの線の太さ

// 画像やモデルの設定
#define DNN_IMG_W 56 // ニューラルネットワーク入力画像の幅
#define DNN_IMG_H 56 // ニューラルネットワーク入力画像の高さ
#define CAM_IMG_W 320 // カメラ画像の幅
#define CAM_IMG_H 240 // カメラ画像の高さ
#define CAM_CLIP_X 48 // 画像の切り取り開始X座標
#define CAM_CLIP_Y 8 // 画像の切り取り開始Y座標
#define CAM_CLIP_W 224 // 画像の切り取り幅
#define CAM_CLIP_H 224 // 画像の切り取り高さ

#define TFT_DC 9
#define TFT_CS -1
#define TFT_RST 8

Adafruit_ILI9341 tft = Adafruit_ILI9341(&SPI, TFT_DC, TFT_CS, TFT_RST);

uint8_t buf[DNN_IMG_W*DNN_IMG_H]; // DNN入力用のバッファ

DNNRT dnnrt; // DNNランタイムのインスタンス
DNNVariable input(DNN_IMG_W*DNN_IMG_H); // DNNの入力変数

static uint8_t const label[3] = {0, 1, 2}; // ラベルの定義

std::vector<int> indexBuffer; // 1秒間のインデックスデータを格納するバッファ
unsigned long lastTime = 0;   // 最後にデータをチェックした時間



#define  CONSOLE_BAUDRATE  115200 // シリアルコンソールのボーレートを115200bpsに設定

//画面の解析結果
int modeIndex = 0; // 初期値を-1に設定


// HTTPリクエストの種類を定義する列挙型
typedef enum {
  POST = 0, // POSTリクエスト
  GET       // GETリクエスト
} DEMO_STATUS_E;

DEMO_STATUS_E httpStat; // 現在のHTTPリクエストの状態を保持
char sendData[100];     // HTTPリクエストで送信するデータを格納する文字配列

const uint16_t RECEIVE_PACKET_SIZE = 1500; // 受信するデータパケットの最大サイズを1500バイトに設定
uint8_t Receive_Data[RECEIVE_PACKET_SIZE] = {0}; // 受信したデータを格納する配列（初期値はすべて0）

TelitWiFi gs2200; // TelitWiFiクラスのインスタンス（Wi-Fiモジュールを管理）
TWIFI_Params gsparams; // Wi-Fi接続に必要なパラメータを格納する構造体
HttpGs2200 theHttpGs2200(&gs2200); // HttpGs2200クラスのインスタンス（HTTP通信を管理）
HTTPGS2200_HostParams hostParams; // HTTPサーバーのホスト情報を格納する構造体

unsigned long lastPostTime = 0; // 最後にPOSTリクエストを送信した時間
const unsigned long postInterval = 10000; // POSTリクエストを送信する間隔（ミリ秒）


// HTTPレスポンス解析関数
void parse_httpresponse(char *message) {
  char *p;
  // "200 OK" がメッセージ内に含まれているかをチェック
  if ((p = strstr(message, "200 OK\r\n")) != NULL) {
    ConsolePrintf("Response : %s\r\n", p + 8);
  }
}
//ディスプレイに表示する関数
// void showText(const char* text, uint16_t color, uint8_t size, int x, int y) {
//   tft.fillScreen(ILI9341_BLACK);// 画面を黒で塗りつぶす

//   // テキスト設定
//   tft.setTextColor(color);
//   tft.setTextSize(size);
//   tft.setCursor(x, y);
//   tft.println(text);
// }

void noren_setup(){
   File nnbfile = theSD.open("model.nnb");

    int ret = dnnrt.begin(nnbfile);
    if (ret < 0) {
        Serial.println("SD card initialized. Model loading result: " + String(ret));
        putStringOnLcd("dnnrt.begin failed" + String(ret), ILI9341_RED);
        return;
    }
    tft.begin();
    tft.setRotation(3);

    theCamera.begin();

    bool streamingStarted = theCamera.startStreaming(true, CamCB);
    if (!streamingStarted) {
        Serial.println("Failed to start camera streaming");
        putStringOnLcd("Streaming Failed", ILI9341_RED);
    } else {
        Serial.println("Camera streaming started successfully");
    }

    Serial.println("neural_network set up all green");
}
void setup() {

  Serial.begin(CONSOLE_BAUDRATE); // シリアル通信を開始（PCと通信）
  // tft.begin(40000000);// ディスプレイ初期化
  pinMode(LED0, OUTPUT);// デジタルピンLED_BUILTINを出力モードに設定
  digitalWrite(LED0, LOW);   // LEDを消灯（LOWは電圧レベル）

  Init_GS2200_SPI_type(iS110B_TypeC);// GS2200のSPI初期化

  // ATコマンドライブラリのバッファを初期化
  gsparams.mode = ATCMD_MODE_STATION; // ステーションモードに設定
  gsparams.psave = ATCMD_PSAVE_DEFAULT; // パワーセーブ設定をデフォルトに設定

  // GS2200の初期化
  if (gs2200.begin(gsparams)) {
    ConsoleLog("GS2200 Initialization Fails"); // 初期化失敗時のログ
    while (1); // 初期化失敗時は無限ループ
  }

  // Wi-Fiアクセスポイントへの接続
  if (gs2200.activate_station(AP_SSID, PASSPHRASE)) {
    ConsoleLog("Association Fails"); // 接続失敗時のログ
    while (1); // 接続失敗時は無限ループ
  } else {
    ConsoleLog("Wi-Fi connected successfully"); // 接続成功時のログ
  }

  // HTTPクライアントの初期化
  hostParams.host = (char *)HTTP_SRVR_IP; // HTTPサーバーのIPアドレス設定
  hostParams.port = (char *)HTTP_PORT;     // HTTPサーバーのポート番号設定
  theHttpGs2200.begin(&hostParams); // HTTPクライアントの開始

  ConsoleLog("Start HTTP Client"); // HTTPクライアント開始のログ

  // HTTPヘッダーの設定
  theHttpGs2200.config(HTTP_HEADER_AUTHORIZATION, "Basic dGVzdDp0ZXN0MTIz"); // 認証ヘッダー
  //theHttpGs2200.config(HTTP_HEADER_TRANSFER_ENCODING, "chunked"); // 転送エンコーディングの設定
  theHttpGs2200.config(HTTP_HEADER_CONTENT_TYPE, "application/x-www-form-urlencoded"); // コンテンツタイプの設定
  theHttpGs2200.config(HTTP_HEADER_HOST, HTTP_SRVR_IP); // ホストヘッダーの設定

  digitalWrite(LED0, HIGH); // LEDを点灯

  noren_setup();
}
void loop() {
  httpStat = POST;
  bool result = false;
  static int LEDcount = 0;
  int received_value = 0;

  while (1) {
    switch (httpStat) {
    case POST:
      theHttpGs2200.config(HTTP_HEADER_TRANSFER_ENCODING, "chunked");

      // modeIndex が1または2の場合のみPOSTリクエストを送信
      if (modeIndex == 1 || modeIndex == 2) {
        Serial.print("POST Data: ");
        // Serial.println(modeIndex);
        if(modeIndex==1){
          Serial.println("おいしくなかった");
        }else{
          Serial.println("おいしかった");
        }
        snprintf(sendData, sizeof(sendData), "data=%d", modeIndex);
        result = theHttpGs2200.post(HTTP_POST_PATH, sendData);
        if (false == result) {
          break;
        }

        do {
          result = theHttpGs2200.receive(5000);
          if (result) {
            theHttpGs2200.read_data(Receive_Data, RECEIVE_PACKET_SIZE);
            ConsolePrintf("%s", (char *)(Receive_Data));
          } else {
            ConsolePrintf("\r\n");
          }
        } while (result);

        result = theHttpGs2200.end();

        delay(2000);
      }

      // POSTしなかった場合でも、次はGETを試みる
      httpStat = GET;
      break;

    case GET:
      theHttpGs2200.config(HTTP_HEADER_TRANSFER_ENCODING, "identity");

      result = theHttpGs2200.get(HTTP_GET_PATH);
      
      if (true == result) {
        theHttpGs2200.read_data(Receive_Data, RECEIVE_PACKET_SIZE);
        parse_httpresponse((char *)(Receive_Data));
      } else {
        ConsoleLog("?? Unexpected HTTP Response ??");
      }

      // 数値に応じてLEDを制御
      received_value = atoi((char *)(Receive_Data) + 8);
      ConsolePrintf("Received Value: %d\r\n", received_value);
         
      if (received_value >= 1) {
        digitalWrite(LED1, HIGH);
        ConsoleLog("LED1 ON (Value > 3)");
        LEDcount++;
      } else {
        digitalWrite(LED1, LOW);
        ConsoleLog("LED1 OFF (Value <= 3)");
      }

      do {
        result = theHttpGs2200.receive(2000);
        if (result) {
          theHttpGs2200.read_data(Receive_Data, RECEIVE_PACKET_SIZE);
          ConsolePrintf("%s", (char *)(Receive_Data));
        } else {
          ConsolePrintf("\r\n");
        }
      } while (result);

      result = theHttpGs2200.end();

      delay(500);
      httpStat = POST;
      break;

    default:
      break;
    }
  }
}
