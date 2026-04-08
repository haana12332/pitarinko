import { useEffect, useState, useRef } from "react";
import { GetImg } from "@/api/firebase/getImg";
import { GetEvaluateAverage } from "@/api/firebase/getLike";
import getShopData from "@/api/firebase/getshopData";
import { ShopInfo } from "@/type/type";

export function SearchPage(): JSX.Element {
  const [shops, setShops] = useState<ShopInfo[]>([]);
  // const [imgID, setImgID] = useState<number>(0);

  const ref = useRef<HTMLDivElement | null>(null); // 明示的な型指定
  const isMounted = useRef(false);
  const lastScrollTopRef = useRef(0);
  const shopID = useRef(3);
  const handleYScroll = async () => {
    const container = ref.current;
    const viewportHeight = window.innerHeight;
    if (container) {
      const currentScrollTop = container.scrollTop;
      if (currentScrollTop >= lastScrollTopRef.current + viewportHeight) {
        console.log(
          "currentScrollTop",
          currentScrollTop,
          ">",
          lastScrollTopRef.current,
          "+",
          viewportHeight
        );
        console.log(shopID.current);
        try {
          const ShopData = await getShopData(shopID.current);
          const newShops = ShopData.filter(
            (newShop) =>
              !shops.some(
                (existingShop) =>
                  existingShop.ShoptextData.id === newShop.ShoptextData.id
              )
          );
          console.log("newshop", ShopData);
          if (isMounted.current) {
            setShops((currentShopsData) => [...currentShopsData, ...newShops]);
          }
        } catch (error) {
          console.error("データ取得エラー:", error);
        }
        lastScrollTopRef.current = currentScrollTop;
        shopID.current += 1;
      }
    }
  };
  useEffect(() => {
    isMounted.current = true;
    const container = ref.current;
    if (container) {
      container.addEventListener("scroll", handleYScroll);
    }
    return () => {
      isMounted.current = false;
      if (container) {
        container.removeEventListener("scroll", handleYScroll);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true; // マウント状態を追跡
    (async () => {
      try {
        const ShopData1 = await getShopData(1);
        const ShopData2 = await getShopData(2);
        const newShops = [...ShopData1, ...ShopData2].filter(
          (newShop) =>
            !shops.some(
              (existingShop) =>
                existingShop.ShoptextData.id === newShop.ShoptextData.id
            )
        );
        console.log(newShops);
        if (isMounted) {
          setShops((current) => [...current, ...newShops]);
        }
      } catch (error) {
        console.error("データの取得中にエラーが発生しました: ", error);
      }
    })();
    return () => {
      isMounted = false;
    }; // クリーンアップ関数でアンマウント時にフラグを更新
  }, []); // shopID に依存して再取得

  return (
    <div className="Search-container" ref={ref}>
      {shops.length > 0 ? (
        shops.map((shop, index) => (
          <section key={shop.ShoptextData.id || index} className="area">
            <div className="text-overlay">
              <h2>id: {shop.ShoptextData.id || "IDがありません"}</h2>
              <h2>
                Shop Name: {shop.ShoptextData.shop_name || "店名がありません"}
              </h2>
              <p>
                {shop.ShoptextData.position
                  ? `緯度${shop.ShoptextData.position._lat} : 経度${shop.ShoptextData.position._long}`
                  : "位置情報なし"}
              </p>
              {shop.ShoptextData.id && (
                <GetEvaluateAverage shop_id={shop.ShoptextData.id} />
              )}
            </div>
            <div className="Shop-container">
              {shop.img && shop.img.length > 0 ? (
                shop.img.map((img, idx) => (
                  <div key={idx} className="shop_img">
                    <GetImg imgPath={img} />
                  </div>
                ))
              ) : (
                <p>画像がありません</p>
              )}
            </div>
          </section>
        ))
      ) : (
        <p>データがありません</p>
      )}
    </div>
  );
}
