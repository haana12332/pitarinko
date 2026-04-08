import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Loading } from "@/components/loading";

export function Layout(): JSX.Element {
  return (
    <Suspense fallback={<Loading />}>
      <Outlet />
    </Suspense>
  );
}
