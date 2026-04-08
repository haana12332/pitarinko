import { createContext, ReactNode } from "react";
import { useState } from "react";
import { Gps } from "@/type/type";
// GpsContextの作成
export const GpsContext = createContext<{
  gpsDate: Gps | null;
  setGpsDate: React.Dispatch<React.SetStateAction<Gps | null>>;
} | null>(null);

// GpsProviderコンポーネント
export function GpsProvider({ children }: { children: ReactNode }) {
  const [gpsDate, setGpsDate] = useState<Gps | null>(null);

  return (
    <GpsContext.Provider value={{ gpsDate, setGpsDate }}>
      {children}
    </GpsContext.Provider>
  );
}
