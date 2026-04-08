import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { firebaseApp } from "@/firebaseConfig/firebaseConfig";

export function GetEvaluateAverage({
  shop_id,
}: {
  shop_id: number;
}): JSX.Element {
  const [evaluateAverage, setEvaluateAverage] = useState<number>(0); // 平均値を保存するための state
  const db = getFirestore(firebaseApp); // Firestore のインスタンスを取得

  useEffect(() => {
    async function getEvaluateData() {
      try {
        const likeCollection = collection(db, "likes");
        const likeQuery = query(
          likeCollection,
          where("shop_id", "==", shop_id)
        ); // shop_id のフィルタリング
        const snapShotlike = await getDocs(likeQuery); // クエリ結果を取得

        // evaluate の合計を計算し、ドキュメント数で割る
        const totalEvaluates = snapShotlike.docs.reduce((acc, doc) => {
          const data = doc.data().evaluate - 1;
          return acc + (data === 1 ? 1 : 0); // evaluate が 1 の場合にのみ加算
        }, 0);
        console.log(
          "評価の合計は",
          totalEvaluates,
          "データ数は",
          snapShotlike.size
        );
        const averageEvaluates =
          snapShotlike.size > 0 ? totalEvaluates / snapShotlike.size : 0; // 平均を計算
        // 小数点以下第三位まで保持して state にセット

        // console.log(Number(averageEvaluates.toFixed(2)) * 3.0);

        setEvaluateAverage(
          Number((Number(averageEvaluates.toFixed(2)) * 5.0).toFixed(2))
        );
      } catch (error) {
        console.error("Error fetching evaluate data:", error);
      }
    }

    getEvaluateData();
  }, []);

  return (
    <div className="Evaluate">
      {evaluateAverage !== null
        ? `Average Evaluate: ${evaluateAverage}`
        : "Loading..."}
    </div>
  );
}
