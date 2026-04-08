import { createContext, ReactNode, useState } from "react";

// 型を指定してSlidingContextを作成
interface SlidingContextType {
  slidingTitle: string;
  setSlidingTitle: (title: string) => void;
}

export const SlidingContext = createContext<SlidingContextType | undefined>(
  undefined
);

export function SlidingProvider({ children }: { children: ReactNode }) {
  const [slidingTitle, setSlidingTitle] = useState<string>("undisplay");

  return (
    <SlidingContext.Provider value={{ slidingTitle, setSlidingTitle }}>
      {children}
    </SlidingContext.Provider>
  );
}
