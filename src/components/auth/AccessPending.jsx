import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AccessPending() {
  const { profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15">
          <ShieldAlert className="h-8 w-8 text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Acceso pendiente</h1>
        <p className="mt-3 text-slate-300">
          La cuenta de <span className="font-semibold text-white">{profile?.email || "este usuario"}</span> existe,
          pero todavia no fue aprobada por un administrador.
        </p>
    
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-slate-200 hover:bg-white/5"
          >
            Volver al inicio
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-3 font-semibold text-black hover:bg-amber-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );
}
