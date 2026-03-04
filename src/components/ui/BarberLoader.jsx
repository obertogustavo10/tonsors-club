import React from "react";
import { motion } from "motion/react";
import { Scissors } from "lucide-react";

/**
 * Loader estilo barbería:
 * - Poste (barber pole) con stripes animadas
 * - Ícono de tijeras con micro-animación
 * - Texto opcional
 */
export default function BarberLoader({
  label = "Cargando...",
  size = "md", // "sm" | "md" | "lg"
  showLabel = true,
}) {
  const dims = size === "sm" ? 42 : size === "lg" ? 72 : 56;
  const poleW = size === "sm" ? 14 : size === "lg" ? 20 : 16;
  const poleH = size === "sm" ? 44 : size === "lg" ? 76 : 60;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Icono + poste */}
      <div className="relative" style={{ width: dims, height: dims }}>
        {/* Scissors */}
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2"
          animate={{ rotate: [0, -8, 8, 0], y: [0, -1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 shadow-lg shadow-amber-500/20">
            <Scissors className="w-5 h-5 text-amber-300" />
          </div>
        </motion.div>

        {/* Barber pole body */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden border border-white/15 bg-white/5 shadow-xl shadow-black/30"
          style={{ width: poleW, height: poleH }}
        >
          {/* animated stripes */}
          <motion.div
            className="absolute inset-0 opacity-95"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(245,158,11,0.95) 0 8px, rgba(255,255,255,0.9) 8px 16px, rgba(59,130,246,0.85) 16px 24px, rgba(255,255,255,0.9) 24px 32px)",
            }}
            animate={{ backgroundPosition: ["0px 0px", "0px 64px"] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />

          {/* gloss */}
          <div className="absolute inset-y-0 left-0 w-1/3 bg-white/10" />
        </div>

        {/* Top & bottom caps */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white/10 border border-white/15"
          style={{ width: poleW + 8, height: 8, top: (dims - poleH) / 2 - 6 }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white/10 border border-white/15"
          style={{ width: poleW + 10, height: 10, top: (dims + poleH) / 2 - 2 }}
        />
      </div>

      {/* Dots line */}
      <motion.div
        className="flex items-center gap-2"
        initial={false}
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
      </motion.div>

      {showLabel && (
        <div className="text-center">
          <div className="text-white font-semibold tracking-wide">{label}</div>
          <div className="text-slate-400 text-xs">Por favor espera un momento</div>
        </div>
      )}
    </div>
  );
}