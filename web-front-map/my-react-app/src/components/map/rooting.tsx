import { GpsContext } from "../context/gpsdata";
import { SlidingContext } from "../context/sidebar";
import { postGps } from "@/api/server/postGps";
import { useEffect, useContext, useState } from "react";
interface RootingStateType {
  state: boolean;
  setState: (value: boolean) => void;
}
export function Rooting({ state, setState }: RootingStateType): JSX.Element {
  const slidingContext = useContext(SlidingContext);
  const [rootingState, setRootingState] = useState<boolean>(false);
  const gpsContext = useContext(GpsContext);
  useEffect(() => {
    // console.log("in", slidingContext?.slidingTitle);
    if (!rootingState && !state) {
      return;
    }
    (async () => {
      try {
        if (gpsContext) {
          const newGps = gpsContext.gpsDate || { lat: 0, lng: 0 };
          await postGps("rooting_test", newGps);
        }
      } catch (error) {
        console.log("postGps Error: ", error);
      }
    })();
  }, [state, slidingContext?.slidingTitle, gpsContext?.gpsDate, rootingState]);
  function handleStart() {
    setRootingState(true);
  }
  function handleStop() {
    setRootingState(false);
  }
  function handleRootingEnd() {
    setState(false);
  }

  return (
    <div
      className={`Rooting-container ${
        state && slidingContext?.slidingTitle == "undisplay" ? "" : "none"
      }`}
    >
      <button onClick={handleStart}>start</button>
      <button onClick={handleStop}>stop</button>
      <button onClick={handleRootingEnd}>end</button>
      <div className={`${rootingState ? "red" : ""}`}></div>
    </div>
  );
}
