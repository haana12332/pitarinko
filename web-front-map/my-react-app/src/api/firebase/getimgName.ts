import { firebaseApp } from "@/firebaseConfig/firebaseConfig";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export async function getImgName(shop_id: number): Promise<string[]> {
  const db = getFirestore(firebaseApp); // Firestoreのインスタンスを取得
  try {
    const imgCollection = collection(db, "img");
    const imgQuery = query(imgCollection, where("shop_id", "==", shop_id));
    const snapShotImg = await getDocs(imgQuery); // クエリ結果を取得
    const imgData: string[] = snapShotImg.docs.map((doc) => {
      return doc.data().name;
    });
    console.log(imgData);
    return imgData;
  } catch (error) {
    console.error("imgの取得に失敗しました", error);
    return [];
  }
}
export default getImgName;
