import React, { useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import logoTonsors from "../assets/logo-tonsors-dorado.png";
import { useAuth } from "../context/AuthContext";
import { isUserApproved } from "../service/auth.service";
import AccessPending from "../components/auth/AccessPending";

const initialLogin = {
  email: "",
  password: "",
};

const initialRegister = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
};

export default function Auth() {
  const { user, profile, loading, login, register } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const from = useMemo(() => location.state?.from?.pathname || "/Admin", [location.state]);

  if (!loading && user && isUserApproved(profile)) {
    return <Navigate to={from} replace />;
  }

  if (!loading && user && !isUserApproved(profile)) {
    return <AccessPending />;
  }

  const normalizeFirebaseError = (firebaseError) => {
    const code = firebaseError?.code || "";

    switch (code) {
      case "auth/email-already-in-use":
        return "Ese correo ya esta registrado.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Correo o contrasena incorrectos.";
      case "auth/invalid-email":
        return "El correo no tiene un formato valido.";
      case "auth/weak-password":
        return "La contrasena debe tener al menos 6 caracteres.";
      default:
        return "No se pudo completar la autenticacion. Intenta nuevamente.";
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setSubmitting(true);
      await login(loginForm);
    } catch (firebaseError) {
      console.error("Error login:", firebaseError);
      setError(normalizeFirebaseError(firebaseError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setSubmitting(true);
      await register(registerForm);
    } catch (firebaseError) {
      console.error("Error registro:", firebaseError);
      setError(normalizeFirebaseError(firebaseError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden lg:flex flex-col justify-between bg-black/20 p-10">
            <div>
              <Link to="/" className="inline-flex items-center gap-3">
                <img
                  src={logoTonsors}
                  alt="Tonsors Club"
                  className="h-16 w-16 object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold text-white">Tonsors Club</h1>
                  <p className="text-sm text-slate-400">Acceso administrativo</p>
                </div>
              </Link>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white">
                Registro de barberos con aprobacion manual
              </h2>
              <p className="mt-4 max-w-md text-slate-300">
                Crea tu cuenta o inicia sesion. Aunque el login sea correcto, el
                ingreso al admin solo se habilita cuando un administrador aprueba
                tu perfil.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-6 flex rounded-2xl border border-white/10 bg-slate-950/40 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${mode === "login"
                      ? "bg-amber-500 text-black"
                      : "text-slate-300 hover:bg-white/5"
                    }`}
                >
                  Iniciar sesion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${mode === "register"
                      ? "bg-amber-500 text-black"
                      : "text-slate-300 hover:bg-white/5"
                    }`}
                >
                  Crear cuenta
                </button>
              </div>

              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white">
                  {mode === "login" ? "Bienvenido de nuevo" : "Solicitar acceso"}
                </h2>
                <p className="mt-2 text-slate-400">
                  {mode === "login"
                    ? "Ingresa con tu correo y contrasena."
                    : "Completa tus datos. La cuenta quedara pendiente hasta ser aprobada."}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {mode === "login" ? (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Correo</label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      placeholder="admin@tonsors.com"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Contrasena
                    </label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      placeholder="******"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-black hover:bg-amber-600 disabled:opacity-60"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Ingresar
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Nombre</label>
                      <input
                        value={registerForm.firstName}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({
                            ...prev,
                            firstName: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Apellido</label>
                      <input
                        value={registerForm.lastName}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({
                            ...prev,
                            lastName: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Correo</label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Telefono</label>
                    <input
                      value={registerForm.phone}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Contrasena
                    </label>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !registerForm.firstName ||
                      !registerForm.lastName ||
                      !registerForm.email ||
                      !registerForm.phone ||
                      !registerForm.password
                    }
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-black hover:bg-amber-600 disabled:opacity-60"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear cuenta
                  </button>
                </form>
              )}

              <div className="mt-6 text-center text-sm text-slate-400">
                <Link to="/" className="text-amber-300 hover:text-amber-200">
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
