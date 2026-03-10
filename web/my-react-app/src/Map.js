import * as React from "react";

const Map = (props) => {
  const apikey = props.apikey;
  const gps = props.gps;

  // Create a reference to the HTML element we want to put the map on
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null); // Mapインスタンスの参照

  // 初期化処理
  React.useLayoutEffect(() => {
    if (!mapRef.current) {
      console.error("mapRef.current is not initialized");
      return;
    }

    const H = window.H;
    const platform = new H.service.Platform({ apikey: apikey });
    const defaultLayers = platform.createDefaultLayers();

    // configure an OMV service to use the `core` endpoint
    var omvService = platform.getOMVService({ path: "v2/vectortiles/core/mc" });
    var baseUrl = "https://js.api.here.com/v3/3.1/styles/omv/oslo/japan/";

    // create a Japan specific style
    var style = new H.map.Style(`${baseUrl}normal.day.yaml`, baseUrl);
    var omvProvider = new H.service.omv.Provider(omvService, style);
    var omvlayer = new H.map.layer.TileLayer(omvProvider, {
      max: 22,
      dark: true,
    });

    // instantiate (and display) a map:
    var map = new H.Map(mapRef.current, omvlayer, {
      zoom: 16,
      center: { lat: gps.lat, lng: gps.lng },
    });

    // Resize listener
    const handleResize = () => map.getViewPort().resize();
    window.addEventListener("resize", handleResize);

    // Enable map events like panning and zooming
    var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

    // Create default UI components
    var ui = H.ui.UI.createDefault(map, defaultLayers);

    // Store the map instance in a ref to access it later
    mapInstanceRef.current = map;

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      map.dispose();
    };
  }, [apikey]);

  // GPSの変化に応じてマーカーとセンターポジションを更新
  React.useEffect(() => {
    if (!mapInstanceRef.current) return;

    const H = window.H;
    const map = mapInstanceRef.current;

    // 既存のマーカーを削除（もし必要なら）
    map.removeObjects(map.getObjects());

    // 新しいマーカーを追加
    const marker = new H.map.Marker({ lat: gps.lat, lng: gps.lng });
    map.addObject(marker);

    // マップのセンターをマーカーの位置に設定
    map.setCenter({ lat: gps.lat, lng: gps.lng });
  }, [gps]);

  return <div style={{ width: "100%", height: "500px" }} ref={mapRef} />;
};

export default Map;
