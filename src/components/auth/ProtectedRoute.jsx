import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import FullPageLoader from "../ui/FullPageLoader";
import { useAuth } from "../../context/AuthContext";
import AccessPending from "./AccessPending";

export default function ProtectedRoute({ children }) {
  const { user, approved, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader show label="Verificando acceso" />;
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (!approved) {
    return <AccessPending />;
  }

  return children;
}
