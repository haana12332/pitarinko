// FirebaseImage.js
import { useEffect, useState } from "react";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

export function GetImg({ imgPath }: { imgPath: string }) {
  const [imageUrl, setImageUrl] = useState<any>(null);

  useEffect(() => {
    const fetchImageUrl = async () => {
      const storage = getStorage();
      const imageRef = ref(storage, imgPath); // Firebase Storage内の画像のパスを指定
      try {
        const url = await getDownloadURL(imageRef);
        setImageUrl(url);
      } catch (error) {
        console.error("画像のURLを取得できませんでした:", error);
      }
    };

    fetchImageUrl();
  }, []);

  return (
    <div>
      {imageUrl ? (
        <img className="shop_img" src={imageUrl} />
      ) : (
        <p>Loading image...</p>
      )}
    </div>
  );
}
