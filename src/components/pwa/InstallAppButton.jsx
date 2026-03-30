import React, { useState } from "react";
import { Download, Share2, Smartphone } from "lucide-react";
import { usePWAInstall } from "../../hooks/usePWAInstall";

export default function InstallAppButton() {
  const {
    isInstalling,
    canPromptInstall,
    shouldShowIOSFallback,
    promptInstall,
  } = usePWAInstall();
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (!canPromptInstall && !shouldShowIOSFallback) {
    return null;
  }

  const handleClick = async () => {
    if (canPromptInstall) {
      const outcome = await promptInstall();
      if (outcome?.outcome) {
        console.info("Resultado instalacion PWA:", outcome.outcome);
      }
      return;
    }

    if (shouldShowIOSFallback) {
      setShowIOSHelp((prev) => !prev);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-3 sm:w-auto">
      <button
        type="button"
        onClick={handleClick}
        disabled={isInstalling}
        className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/10 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-black/20 backdrop-blur-md transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Download className="mr-2 h-5 w-5" />
        {isInstalling ? "Abriendo instalacion..." : "Instalar app"}
      </button>

      {shouldShowIOSFallback && showIOSHelp && (
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/75 p-4 text-left text-sm text-slate-200 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-amber-300">
            <Smartphone className="h-4 w-4" />
            <span className="font-semibold">Instalacion en iPhone</span>
          </div>
          <p className="mt-2 leading-6 text-slate-300">
            Para instalar esta app en iPhone, abre en Safari, toca
            <span className="mx-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-white">
              <Share2 className="h-3.5 w-3.5" />
              Compartir
            </span>
            y luego elige "Agregar a pantalla de inicio".
          </p>
        </div>
      )}
    </div>
  );
}
