import { useState, useEffect } from "react";
import Map from "./Map";
import Search from "./Search";

const apikey = process.env.REACT_APP_API_KEY;
console.log(apikey);
function App() {
  const [gps, setGps] = useState({
    lat: "35.6814568602531", // 初期位置
    lng: "139.76799772026422", // 初期位置
  });

  useEffect(() => {
    // watchPositionを使って現在位置を監視
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Updated Position:", latitude, longitude);
        // 位置が変わったら地図のGPSを更新
        setGps({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error retrieving location:", error);
      },
      {
        enableHighAccuracy: true, // 精度を高くする
        maximumAge: 0, // キャッシュを使わず常に最新の情報を取得
        timeout: 5000, // 5秒以内にタイムアウト
      }
    );

    // コンポーネントがアンマウントされたときにwatchPositionをクリア
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return (
    <div>
      <Search apikey={apikey} onGeocodeResult={(query) => setGps(query)} />
      <Map apikey={apikey} gps={gps} />
    </div>
  );
}

export default App;
