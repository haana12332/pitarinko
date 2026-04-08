import React, { useEffect, useState, useRef, useContext } from "react";
import { Gps } from "@/type/type";
import { shopsearch } from "@/api/here/shopSearch";
import { routeSearch } from "@/api/here/routeSearch"; // ルート検索関数をインポート
import { SearchResult } from "@/type/type";
import { SlidingContext } from "../context/sidebar";
import { Rooting } from "./rooting";
interface DisplayMapProps {
  apikey: string;
  origin: Gps;
}

declare global {
  interface Window {
    H: any;
  }
}

export function DisplayMap({ apikey, origin }: DisplayMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const currentPositionMarkerRef = useRef<any>(null); // 現在位置マーカーの参照
  const [shopResult, setShopResult] = useState<SearchResult[]>([]);
  const [searchText, setSearchText] = useState(""); // 検索ボックスの入力状態を管理
  const [destination, setDestination] = useState<Gps | null>(null);
  const slidingTitle = useContext(SlidingContext);
  const [rootingDisplay, setRootingDisplay] = useState<boolean>(false);
  // 近くの店を探す
  const handleChangeShops = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchText = e.target.value;
    setSearchText(searchText); // 入力状態を更新

    if (searchText.trim() === "") {
      setShopResult([]); // 検索結果をクリアする
      setDestination(null); // 目的地をクリアしてルートを消す
      return;
    }

    const fetchShops = async () => {
      try {
        const result: SearchResult[] = await shopsearch(
          apikey,
          searchText,
          origin
        );
        setShopResult(result); // 結果をステートに保存
      } catch (error) {
        console.error("Error fetching shop results:", error);
      }
    };

    fetchShops(); // 非同期関数を呼び出す
  };
  // 店までのルートを検索し、マップ上に表示
  const handleSearchRoute = async (index: number) => {
    const targetShop = shopResult[index];
    setDestination(targetShop.position); // 目的地を設定
    setRootingDisplay(true);
  };

  // 初期化: マップの描画を行う
  useEffect(() => {
    if (!mapRef.current) {
      console.error("mapRef.current is not initialized");
      return;
    }

    const H = window.H;
    const platform = new H.service.Platform({ apikey });
    const defaultLayers = platform.createDefaultLayers();

    const omvService = platform.getOMVService({
      path: "v2/vectortiles/core/mc",
    });
    const baseUrl = "https://js.api.here.com/v3/3.1/styles/omv/oslo/japan/";

    const style = new H.map.Style(`${baseUrl}normal.day.yaml`, baseUrl);
    const omvProvider = new H.service.omv.Provider(omvService, style);
    const omvLayer = new H.map.layer.TileLayer(omvProvider, {
      max: 22,
      dark: true,
    });

    const map = new H.Map(mapRef.current, omvLayer, {
      zoom: 16,
      center: { lat: origin.lat, lng: origin.lng },
    });

    const handleResize = () => map.getViewPort().resize();
    window.addEventListener("resize", handleResize);

    new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    H.ui.UI.createDefault(map, defaultLayers);

    mapInstanceRef.current = map;

    // 現在位置のマーカーを初期化
    const marker = new H.map.Marker({ lat: origin.lat, lng: origin.lng });
    map.addObject(marker);
    currentPositionMarkerRef.current = marker;

    return () => {
      window.removeEventListener("resize", handleResize);
      map.dispose();
    };
  }, [apikey]);

  // 現在位置マーカーの更新
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPositionMarkerRef.current) return;

    const map = mapInstanceRef.current;
    const currentPositionMarker = currentPositionMarkerRef.current;

    // 現在位置のマーカーを更新
    currentPositionMarker.setGeometry({ lat: origin.lat, lng: origin.lng });

    // マップの中心も更新
    map.setCenter({ lat: origin.lat, lng: origin.lng });
  }, [origin]);

  // ルートラインとショップの表示を管理するuseEffect
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const H = window.H;
    const map = mapInstanceRef.current;

    // マップ上のオブジェクトをクリア（現在位置マーカーは除く）
    const objectsToRemove = map
      .getObjects()
      .filter((obj: any) => obj !== currentPositionMarkerRef.current);
    map.removeObjects(objectsToRemove);

    // 検索結果のマーカーを表示
    shopResult.forEach((result) => {
      const position = result.position;
      const iconUrl =
        "/explore_nearby_24dp_EA3323_FILL0_wght400_GRAD0_opsz24.svg"; // ローカルのアイコン画像パス
      const icon = new H.map.Icon(iconUrl); // アイコンを指定
      const searchMarker = new H.map.Marker(
        { lat: position.lat, lng: position.lng },
        { icon }
      );
      map.addObject(searchMarker); // マーカーをマップに追加
    });

    // ルート検索を行う
    const searchRoute = async () => {
      if (origin && destination) {
        try {
          const route = await routeSearch(apikey, origin, destination);
          if (route && route.polyline) {
            const linestring = H.geo.LineString.fromFlexiblePolyline(
              route.polyline
            );
            const newRouteLine = new H.map.Polyline(linestring, {
              style: { strokeColor: "blue", lineWidth: 3 },
            });
            map.addObjects([newRouteLine]);
            map
              .getViewModel()
              .setLookAtData({ bounds: newRouteLine.getBoundingBox() });
          } else {
            console.error("Route polyline is missing");
          }
        } catch (error) {
          console.error("Error searching route:", error);
        }
      }
    };

    searchRoute(); // ルート検索を実行
  }, [shopResult, destination]);
  function handlebackground() {
    slidingTitle?.setSlidingTitle("undisplay");
  }
  return (
    <div className="map-container">
      <input
        type="text"
        className={`map-input ${
          slidingTitle?.slidingTitle != "undisplay" || rootingDisplay
            ? "undisplay"
            : ""
        }`}
        onChange={handleChangeShops}
        placeholder="Search location ..."
      />
      {searchText.trim() !== "" && shopResult.length > 0 && (
        <div className={`shop-results ${rootingDisplay ? "undisplay" : ""}`}>
          {shopResult.map((result, index) => (
            <div
              onClick={() => handleSearchRoute(index)}
              key={index}
              className="shop-result-item"
            >
              <h3>{result.title}</h3>
              <p>
                Position: {result.position.lat}, {result.position.lng}
              </p>
              <p>Distance: {result.distance} meters</p>
            </div>
          ))}
        </div>
      )}
      <div
        className={`${
          slidingTitle?.slidingTitle != "undisplay" ? "black-background " : ""
        }`}
        onClick={handlebackground}
      ></div>
      <div className="mapingroot">
        <div className="map-ref" ref={mapRef} />
        <Rooting state={rootingDisplay} setState={setRootingDisplay}></Rooting>
      </div>
    </div>
  );
}

export default DisplayMap;
