import React from "react";

export default function MobileStepFooter({
  children,
  className = "",
  align = "between", // "between" | "right" | "center"
}) {
  // Conteo de hijos (para detectar 1 botón)
  const count = React.Children.toArray(children).filter(Boolean).length;

  // En desktop:
  // - si hay 1 botón => a la derecha
  // - si hay 2+ => between (uno izq, otro der)
  const desktopJustify =
    align === "right" || count === 1 ? "sm:justify-end" : "sm:justify-between";

  // En mobile siempre columna full
  const mobileLayout = "flex flex-col gap-3";

  return (
    <>
      {/* Spacer SOLO mobile (para que no tape contenido) */}
      <div className="h-28 sm:h-0" />

      {/* ✅ Mobile: fixed overlay | ✅ Desktop: NO overlay, NO fixed */}
      <div
        className={[
          // Mobile overlay
          "fixed bottom-0 left-0 right-0 z-50 sm:static",
          "border-t border-white/10",
          "bg-slate-950/70 backdrop-blur-md sm:bg-transparent sm:backdrop-blur-0 sm:border-0",
          "px-4 py-3 sm:px-0 sm:py-0",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0",
          className,
        ].join(" ")}
      >
        <div className="max-w-4xl mx-auto">
          <div
            className={[
              mobileLayout,
              "sm:flex sm:flex-row sm:items-center",
              desktopJustify,
              "sm:gap-4",
            ].join(" ")}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}