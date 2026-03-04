import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Admins from "./pages/Admin";
import Client from "./pages/Client";
import Home from "./pages/Home";

export default function AppRoutes() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
/*     {
      path: "/Admin",
      element: <Admins />,
    }, */
    {
      path: "/Client",
      element: <Client />,
    }
  ]);

  return <RouterProvider router={router} />;
}
