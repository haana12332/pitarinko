import { useEffect, useState, useContext } from "react";
import DisplayMap from "@/components/map/displayMap.jsx";
import { Gps } from "@/type/type";
import { GpsContext } from "./context/gpsdata";

const apikey: string = import.meta.env.VITE_API_KEY;
console.log("apikey", apikey);

export function Map() {
  const gpsContext = useContext(GpsContext); // gpsContext全体を取得
  const [gps, setGps] = useState<Gps>({
    lat: 35.6814568602531, // 初期位置
    lng: 139.76799772026422, // 初期位置
  });

  useEffect(() => {
    // watchPositionを使って現在位置を監視
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Updated Position:", latitude, longitude);
        // 位置が変わったらstateのGPSを更新
        const newGps = { lat: latitude, lng: longitude };
        setGps(newGps);
        // gpsContextが存在する場合にのみ更新を行う
        if (gpsContext && gpsContext.setGpsDate) {
          gpsContext.setGpsDate(newGps);
        }
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
  }, []); // gpsContextを依存配列に追加

  return (
    <div>
      <DisplayMap apikey={apikey} origin={gps} />
    </div>
  );
}
