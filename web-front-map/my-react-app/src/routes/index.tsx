import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/layout";
import { RequireAuth } from "@/components/require_auth";
import { Map } from "@/components/map.jsx";
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          {
            index: true,
            element: <Map />,
          },
        ],
      },
    ],
  },
]);
