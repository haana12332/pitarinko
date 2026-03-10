#include <HttpGs2200.h> // GS2200のHTTP機能を操作するライブラリをインクルード
#include <TelitWiFi.h>  // GS2200 Wi-Fiモジュールの基本的な機能を操作するライブラリをインクルード
#include "config.h"     // ユーザー定義の設定を含むヘッダーファイルをインクルード

#define LAT 35.659905304790925  // 緯度
#define LNG 139.79440782269975 // 経度

// 距離計算用の関数（Haversine Formula）
float calculateDistanceInMeters(float lat1, float lng1) {
    const float R = 6371000; // 地球の半径 (メートル)

    // 緯度と経度をラジアンに変換
    float dLat = (lat1 - LAT) * M_PI / 180.0;
    float dLng = (lng1 - LNG) * M_PI / 180.0;

    // 中間変数
    float a = sin(dLat / 2) * sin(dLat / 2) +
              cos(LAT * M_PI / 180.0) * cos(lat1 * M_PI / 180.0) *
              sin(dLng / 2) * sin(dLng / 2);
    float c = 2 * atan2(sqrt(a), sqrt(1 - a));

    // 距離計算
    return R * c;
}

#define CONSOLE_BAUDRATE 115200

typedef enum {
    POST = 0,
    GET
} DEMO_STATUS_E;

DEMO_STATUS_E httpStat;
char sendData[100];

const uint16_t RECEIVE_PACKET_SIZE = 1500;
uint8_t Receive_Data[RECEIVE_PACKET_SIZE] = {0};

TelitWiFi gs2200;
TWIFI_Params gsparams;
HttpGs2200 theHttpGs2200(&gs2200);
HTTPGS2200_HostParams hostParams;

void parse_httpresponse(char *message) {
    char *p;

    if ((p = strstr(message, "200 OK\r\n")) != NULL) {
        ConsolePrintf("Response : %s\r\n", p + 8);
    }
}

void setup() {
    pinMode(LED0, OUTPUT);
    digitalWrite(LED0, LOW);
    Serial.begin(CONSOLE_BAUDRATE);

    Init_GS2200_SPI_type(iS110B_TypeC);

    gsparams.mode = ATCMD_MODE_STATION;
    gsparams.psave = ATCMD_PSAVE_DEFAULT;
    if (gs2200.begin(gsparams)) {
        ConsoleLog("GS2200 Initilization Fails");
        while (1);
    }

    if (gs2200.activate_station(AP_SSID, PASSPHRASE)) {
        ConsoleLog("Association Fails");
        while (1);
    }

    hostParams.host = (char *)HTTP_SRVR_IP;
    hostParams.port = (char *)HTTP_PORT;
    theHttpGs2200.begin(&hostParams);

    ConsoleLog("Start HTTP Client");

    theHttpGs2200.config(HTTP_HEADER_AUTHORIZATION, "Basic dGVzdDp0ZXN0MTIz");
    theHttpGs2200.config(HTTP_HEADER_TRANSFER_ENCODING, "chunked");
    theHttpGs2200.config(HTTP_HEADER_CONTENT_TYPE, "application/x-www-form-urlencoded");
    theHttpGs2200.config(HTTP_HEADER_HOST, HTTP_SRVR_IP);

    digitalWrite(LED0, HIGH);
}

void loop() {
    bool result = false;
    theHttpGs2200.config(HTTP_HEADER_TRANSFER_ENCODING, "identity");
    float lat = 0.0;
    float lng = 0.0;

    result = theHttpGs2200.get(HTTP_GET_PATH);

    if (result) {
        ConsoleLog("GET request to /Move endpoint sent successfully");

        theHttpGs2200.read_data(Receive_Data, RECEIVE_PACKET_SIZE);
        ConsolePrintf("Raw Data: %s\n", (char *)(Receive_Data));

        char *dataStart = strstr((char *)Receive_Data, "\n");
        if (dataStart != NULL) {
            dataStart++;
        } else {
            dataStart = (char *)Receive_Data;
        }

        char *token = strtok(dataStart, ",");
        int index = 0;

        while (token != NULL) {
            Serial.print("Token ");
            Serial.print(index);
            Serial.print(": ");
            Serial.println(token);

            if (index == 0) {
                lat = atof(token);
            } else if (index == 1) {
                lng = atof(token);
            }
            index++;
            token = strtok(NULL, ",");
        }

        Serial.print("緯度: ");
        Serial.println(lat, 6);
        Serial.print("経度: ");
        Serial.println(lng, 6);

        // 距離を計算し出力
        float distance = calculateDistanceInMeters(lat, lng);
        Serial.print("距離: ");
        Serial.print(distance);
        Serial.println(" メートル");
        //3 m 以内 
        if( distance < 1){
           move();
        }
       
    } else {
        ConsoleLog("?? Unexpected HTTP Response ??");
    }

    delay(2000);
}
