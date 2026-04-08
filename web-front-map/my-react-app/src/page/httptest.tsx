import { useContext } from "react";
import { GpsContext } from "../components/context/gpsdata";
import { useState, useEffect } from "react";
import { postGps } from "@/api/server/postGps";
import { getData } from "@/api/server/getData";

export function Httptest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [serverData, setServerData] = useState<string | null>(null);
  const [inputData, setInputData] = useState<string>(""); // テキストボックス用のステート

  const gpsContext = useContext(GpsContext);
  if (gpsContext) {
    console.log("sliding", gpsContext.gpsDate);
  }

  useEffect(() => {
    checkServerStatus(); // 初回ロード時にサーバーのステータスをチェック
  }, []);

  async function handleSendData() {
    try {
      // gpsDateを取得（nullの場合を考慮）
      const gpsData = gpsContext?.gpsDate || { lat: 0, lng: 0 };

      // 正しい値（inputDataとgpsData）をpostGpsに渡す
      await postGps(inputData, gpsData);
    } catch (error) {
      console.log("postGps Error: ", error);
    }
  }

  async function checkServerStatus() {
    try {
      const data = await getData(); // getData関数を呼び出してサーバーからデータを取得
      setServerData(data); // 取得したデータをserverDataステートに保存
      setLogs((prevLogs) => [
        ...prevLogs,
        "Server data retrieved successfully.",
      ]); // ログに追加
    } catch (error) {
      console.error("Error retrieving server data: ", error);
      setLogs((prevLogs) => [...prevLogs, "Failed to retrieve server data."]); // ログにエラー追加
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", margin: 0 }}>
      {/* サイドバー */}
      <div
        style={{ flex: "0 0 150px", padding: "10px", background: "#f0f0f0" }}
      >
        <h3>Sliding Panel</h3>

        {/* テキストボックスを追加 */}
        <input
          type="text"
          value={inputData}
          placeholder="Test Data from Client"
          onChange={(e) => setInputData(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <button style={{ margin: "10px 0" }} onClick={handleSendData}>
          Send Data to Server
        </button>
        <button style={{ margin: "10px 0" }} onClick={checkServerStatus}>
          Check Server Status
        </button>

        {/* サーバーからのデータを表示 */}
        <div>
          <h4>Server Data:</h4>
          <pre>
            {serverData
              ? JSON.stringify(serverData, null, 2)
              : "No data from server yet."}
          </pre>
        </div>

        {/* ログメッセージを表示 */}
        <div>
          <h4>Logs:</h4>
          {logs.map((log, index) => (
            <p key={index}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
