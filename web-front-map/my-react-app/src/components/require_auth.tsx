import { Outlet } from "react-router-dom";
import { useContext, useState, useEffect } from "react";

import { SidebarData } from "./sidebarData";
import { SlidingPanel } from "@/components/slidingPanel"; // SlidingPanelコンポーネントをインポート
import { GpsProvider } from "./context/gpsdata";
import { SlidingContext } from "./context/sidebar";

export function RequireAuth(): JSX.Element {
  const slidingContext = useContext(SlidingContext);
  useEffect(() => {
    // console.log("sliding context is ",slidingContext?.slidingTitle);
  }, [slidingContext?.slidingTitle]);
  return (
    <GpsProvider>
      <div className="flex">
        <Sidebar />
        <div className={`Sliding ${slidingContext?.slidingTitle}`}>
          <SlidingPanel />
        </div>
        <div className="flex-1 map-container">
          <Outlet />
        </div>
      </div>
    </GpsProvider>
  );
}

export function Sidebar(): JSX.Element {
  const [clickedTitle, setClickedTitle] = useState<string>("undisplay");
  const slidingContext = useContext(SlidingContext);
  function handleDisplayChange(title: string) {
    if (slidingContext?.slidingTitle === title) {
      slidingContext?.setSlidingTitle("undisplay");
      setClickedTitle("undisplay");
    } else {
      slidingContext?.setSlidingTitle(title);
      setClickedTitle(title);
    }
  }
  return (
    <div id="Sidebar">
      <ul>
        {SidebarData.map((value, key) => {
          return (
            <li key={key} onClick={() => handleDisplayChange(value.title)}>
              <button
                className={`btn sidebar ${
                  clickedTitle === value.title ? "display" : ""
                }`}
              >
                <div>{value.icon}</div>
                <p>{value.title}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
