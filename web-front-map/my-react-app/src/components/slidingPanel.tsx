import { useContext, useEffect } from "react";
import { SlidingContext } from "./context/sidebar";
import { Httptest } from "@/page/httptest";
import { SearchPage } from "@/page/search";
import { UserPage } from "@/page/user";
import { PostPage } from "@/page/post";

export function SlidingPanel(): JSX.Element {
  const slidingContext = useContext(SlidingContext);

  useEffect(() => {
    // slidingTitleの変化を監視し、必要に応じてサイドエフェクトを実行
    console.log("Sliding Title:", slidingContext?.slidingTitle);
  }, [slidingContext?.slidingTitle]);

  // slidingTitleが"undisplay"の場合にはnullを返し、他の値でコンテンツを表示する
  if (slidingContext?.slidingTitle === "undisplay") {
    return <div></div>;
  }
  return (
    <>
      {slidingContext?.slidingTitle === "post" && <PostPage />}
      {slidingContext?.slidingTitle === "http" && <Httptest />}
      {slidingContext?.slidingTitle === "ユーザー" && <UserPage />}
      {slidingContext?.slidingTitle === "トレンド" && <SearchPage />}
    </>
  );
}
