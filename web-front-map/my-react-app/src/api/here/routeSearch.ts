import { Gps } from "@/type/type";

export async function routeSearch(apikey: string, origin: Gps, destination: Gps) {
  const baseUrl = "https://router.hereapi.com/v8/routes"; // HEREルーティングAPIのエンドポイント
  const params = new URLSearchParams({
    apikey,
    transportMode: "pedestrian", // 車、徒歩などの移動モード
    origin: `${origin.lat},${origin.lng}`, // 出発地点（緯度,経度）
    destination: `${destination.lat},${destination.lng}`, // 目的地（緯度,経度）
    return: "polyline", // ポリラインを返す
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // レスポンスからルートのポリラインを抽出
    const routes = data.routes;
    if (routes && routes.length > 0) {
      const route = routes[0]; // 最初のルートを使用
      const polyline = route.sections[0].polyline; // ポリラインを取得
      return { polyline }; // ポリラインを返す
    } else {
      throw new Error("No routes found");
    }
  } catch (error) {
    console.error("Error fetching route:", error);
    throw error; // エラーを呼び出し元に伝える
  }
}
