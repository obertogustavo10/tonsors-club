import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import Admins from "./pages/Admin";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function AppRoutes() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Auth />,
    },
    {
      path: "/auth",
      element: <Navigate to="/" replace />,
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
