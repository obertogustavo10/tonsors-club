import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Admins from "./pages/Admin";
import Auth from "./pages/Auth";
import Client from "./pages/Client";
import Home from "./pages/Home";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function AppRoutes() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
/*     {
      path: "/auth",
      element: <Auth />,
    },
    {
      path: "/Admin",
      element: (
        <ProtectedRoute>
          <Admins />
        </ProtectedRoute>
      ),
    }, */
    {
      path: "/Client",
      element: <Client />,
    }
  ]);

  return <RouterProvider router={router} />;
}
