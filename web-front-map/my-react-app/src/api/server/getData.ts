export const getData = async (): Promise<any> => {
  const url = "http://localhost:8080/postData"; // 正しいエンドポイントに修正
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  if (!res.ok) {
    console.error("GetData Error");
  }
  const data = await res.json();
  console.log("getData", data);
  return data;
};
