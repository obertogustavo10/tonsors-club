import React from "react";
import { AnimatePresence, motion } from "motion/react";
import BarberLoader from "./BarberLoader";

/**
 * Overlay fullscreen para cualquier página.
 * Usalo con show={isLoading}
 */
export default function FullPageLoader({
  show,
  label = "Cargando datos...",
  blur = true,
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`fixed inset-0 z-[9999] flex items-center justify-center ${
            blur ? "backdrop-blur-md" : ""
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(245,158,11,0.10), transparent 45%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.10), transparent 40%), rgba(2,6,23,0.72)",
          }}
        >
          <motion.div
            initial={{ y: 10, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="p-6 rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40"
          >
            <BarberLoader label={label} size="lg" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}