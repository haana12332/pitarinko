#define AIN1 14  // モーター制御用のピン1
#define AIN2 15  // モーター制御用のピン2
#define CONSOLE_BAUDRATE 115200
void setup() {
  // put your setup code here, to run once:
      Serial.begin(CONSOLE_BAUDRATE);
}

void loop() {
  // put your main code here, to run repeatedly:
  analogWrite(AIN1, 255);  // AIN1にPWM信号を送信（0〜100の範囲）
  analogWrite(AIN2, 0);  // AIN2は0に設定（逆方向を無効化）
  Serial.println("up");     // シリアルモニターに現在のPWM値を表示
  delay(2000);
  
   analogWrite(AIN1, 0);  // AIN1にPWM信号を送信（0〜100の範囲）
  analogWrite(AIN2, 255);  // AIN2は0に設定（逆方向を無効化）
  Serial.println("down");     // シリアルモニターに現在のPWM値を表示
  delay(2000);
}
