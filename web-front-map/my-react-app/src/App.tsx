import { RouterProvider } from "react-router-dom";
import { Suspense } from "react";
import { Loading } from "@/components/loading";
import { router } from "@/routes";
import { SlidingProvider } from "./components/context/sidebar";
function App() {
  return (
    <>
      <SlidingProvider>
        <Suspense fallback={<Loading />}>
          <RouterProvider router={router} />
        </Suspense>
      </SlidingProvider>
    </>
  );
}

export default App;
