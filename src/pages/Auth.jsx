import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, KeyRound, LogIn, UserPlus } from "lucide-react";
import logoTonsors from "../assets/logo-tonsors-dorado.png";
import { useAuth } from "../context/AuthContext";
import {
  isUserApproved,
  sendPanelPasswordReset,
} from "../service/auth.service";
import AccessPending from "../components/auth/AccessPending";
import InstallAppButton from "../components/pwa/InstallAppButton";
import FullPageLoader from "../components/ui/FullPageLoader";
import {
  clearRememberedPanelLogin,
  getRememberedPanelLogin,
  saveRememberedPanelLogin,
} from "../service/panelSession.service";

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
  const [rememberCredentials, setRememberCredentials] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const from = useMemo(() => location.state?.from?.pathname || "/admin", [location.state]);

  useEffect(() => {
    const rememberedLogin = getRememberedPanelLogin();

    if (!rememberedLogin) {
      return;
    }
    setLoginForm({
      email: rememberedLogin.email || "",
      password: rememberedLogin.password || "",
    });
    setRememberCredentials(Boolean(rememberedLogin.email || rememberedLogin.password));
  }, []);
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
      case "auth/missing-email":
        return "Ingresa tu correo para recuperar la contrasena.";
      case "auth/too-many-requests":
        return "Demasiados intentos. Espera un momento e intenta otra vez.";
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

      if (rememberCredentials) {
        saveRememberedPanelLogin(loginForm);
      } else {
        clearRememberedPanelLogin();
      }
    } catch (firebaseError) {
      console.error("Error login:", firebaseError);
      setError(normalizeFirebaseError(firebaseError));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setResetMessage("");

    try {
      setResetSubmitting(true);
      await sendPanelPasswordReset(loginForm.email);
      setResetMessage(
        "Te enviamos un correo para restablecer la contrasena. Revisa tu bandeja y spam."
      );
    } catch (firebaseError) {
      console.error("Error reset password:", firebaseError);
      if (firebaseError?.message === "email-required") {
        setError("Ingresa tu correo para recuperar la contrasena.");
      } else {
        setError(normalizeFirebaseError(firebaseError));
      }
    } finally {
      setResetSubmitting(false);
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
      <FullPageLoader
        show={submitting}
        label={mode === "register" ? "Creando cuenta" : "Iniciando sesion"}
      />

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden lg:flex flex-col justify-between bg-black/20 p-10">
            <div>
              <div className="inline-flex items-center gap-3">
                <img
                  src={logoTonsors}
                  alt="Tonsors Club"
                  className="h-16 w-16 object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold text-white">Tonsors Club</h1>
                  <p className="text-sm text-slate-400">Acceso directo de barberos</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white">
                Ingreso rapido al panel de trabajo
              </h2>
              <p className="mt-4 max-w-md text-slate-300">
                Esta variante deja solo el acceso al panel. La sesion se mantiene
                persistida y, si eliges recordar tus datos, el formulario vuelve
                a cargarlos automaticamente cuando haga falta volver a ingresar.
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
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    mode === "login"
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
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    mode === "register"
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
                    ? "Ingresa con tu correo y contrasena para abrir el panel."
                    : "Completa tus datos. La cuenta quedara pendiente hasta ser aprobada."}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {resetMessage && (
                <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {resetMessage}
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
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(event) =>
                          setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white outline-none"
                        placeholder="******"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        aria-label={
                          showLoginPassword
                            ? "Ocultar contrasena"
                            : "Mostrar contrasena"
                        }
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberCredentials}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setRememberCredentials(checked);

                        if (!checked) {
                          clearRememberedPanelLogin();
                        }
                      }}
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-amber-500 focus:ring-amber-500"
                    />
                    Recordar correo y contrasena en este dispositivo
                  </label>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((prev) => !prev)}
                      className="text-sm text-amber-300 hover:text-amber-200"
                    >
                      {showResetPassword
                        ? "Ocultar recuperacion"
                        : "Olvide mi contrasena"}
                    </button>

                    {showResetPassword && (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <p className="text-sm text-slate-300">
                          Te enviaremos un correo para cambiar la contrasena del acceso al panel.
                        </p>
                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={resetSubmitting}
                          className="mt-3 inline-flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          {resetSubmitting
                            ? "Enviando correo..."
                            : "Enviar correo de recuperacion"}
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !loginForm.email || !loginForm.password}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-black hover:bg-amber-600 disabled:opacity-60"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Ingresar al panel
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
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        value={registerForm.password}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({
                            ...prev,
                            password: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        aria-label={
                          showRegisterPassword
                            ? "Ocultar contrasena"
                            : "Mostrar contrasena"
                        }
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
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

              <div className="mt-6 border-t border-white/10 pt-6">
                <div className="flex justify-center">
                  <InstallAppButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
