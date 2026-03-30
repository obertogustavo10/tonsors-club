import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import Admins from "./pages/Admin";
import Auth from "./pages/Auth";
import Client from "./pages/Client";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Home from "./pages/Home";

export default function AppRoutes() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/auth",
      element: <Auth />,
    },
    {
      path: "/admin",
      element: (
        <ProtectedRoute>
          <Admins />
        </ProtectedRoute>
      ),
    },
    {
      path: "/client",
      element: <Client />,
    },
    {
      path: "/Client",
      element: <Navigate to="/client" replace />,
    },
    {
      path: "/Admin",
      element: <Navigate to="/admin" replace />,
    },
    {
      path: "*",
      element: <Navigate to="/" replace />,
    },
  ]);

  return <RouterProvider router={router} />;
}
