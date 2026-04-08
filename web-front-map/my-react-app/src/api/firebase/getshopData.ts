import {
  collection,
  query,
  getFirestore,
  where,
  getDocs,
  doc,
} from "firebase/firestore";
import { firebaseApp } from "@/firebaseConfig/firebaseConfig";
import { ShopInfo } from "@/type/type";

export async function getShopData(shopID: number): Promise<ShopInfo[]> {
  const db = getFirestore(firebaseApp); // Firestoreのインスタンスを取得
  try {
    const shopCollection = collection(db, "shop"); // コレクションを取得
    const shopQuery = query(shopCollection, where("id", "==", shopID)); // クエリを作成

    const querySnapshot = await getDocs(shopQuery);
    if (!querySnapshot.empty) {
      const shopData: ShopInfo[] = [];
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const shopDocRef = doc(db, "shop", docSnapshot.id); // ドキュメントへの参照を取得
        const imagesCollectionRef = collection(shopDocRef, "img"); // サブコレクションへの参照を取得
        const imagesSnapshot = await getDocs(imagesCollectionRef);
        const images: string[] = imagesSnapshot.docs.map(
          (doc) => doc.data().img_name
        ); // すべての画像データを取得

        // 生データをログに出力
        // console.log("Raw data:", data);
        // console.log("Image data:", images);

        shopData.push({
          ShoptextData: {
            id: data.id,
            shop_name: data.shop_name,
            position: data.position,
          },
          img: images, // 画像データを配列として追加
        });
      }
      return shopData;
    } else {
      console.log("該当する店舗が見つかりませんでした。");
      return [];
    }
  } catch (error) {
    console.error("データの取得に失敗しました:", error);
    return []; // エラーが発生した場合は空の配列を返す
  }
}
export default getShopData;
