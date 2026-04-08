import { Gps } from "@/type/type";
export const postGps = async (text: string, gps: Gps) => {
  const url = "http://localhost:8080/postData"; // 正しいエンドポイントに修正

  const payload = {
    text, // text: textと同じ意味
    gps: JSON.stringify(gps),
  };
  console.log(gps, text);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(payload).toString(), // クエリ形式に変換して送信
    mode: "no-cors", // CORS チェックを無効化
  });

  if (!res.ok) {
    console.log("postGps error: ", res.status, res.statusText);
  } else {
    const data = await res.json();
    console.log("postGps success: ", data); // 成功時のレスポンスを処理
  }
};
