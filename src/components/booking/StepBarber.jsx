import React from 'react';
import { Card, Button } from "@radix-ui/themes";
import { User, Star, Shuffle, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from "motion/react";
import MobileStepFooter from "../ui/MobileStepFooter";
import AppButton from "../ui/AppButton";
export default function StepBarber({
  barbers,
  selected,
  autoAssign,
  onSelect,
  onAutoAssign,
  onNext,
  onBack,
}) {
  console.log("Barbers:", barbers);
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Elige tu barbero</h2>
        <p className="text-slate-400">Selecciona quien te atenderá o déjanos asignarte uno</p>
      </div>
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-slate-400 text-sm">o elige tu preferido</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Barbers grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.map((barber, index) => (
          <motion.div
            key={barber.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`p-6 cursor-pointer transition-all duration-300 border-2 ${
                selected?.id === barber.id
                  ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
              onClick={() => onSelect(barber)}
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden bg-white/10">
                  {barber.imageUrl || barber.photo_url ? (
                    <img
                      src={barber.imageUrl || barber.photo_url}
                      alt={barber.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-amber-400" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{barber.name}</h3>
                {barber.specialty && (
                  <p className="text-sm text-slate-400 mb-2">{barber.specialty}</p>
                )}
{/*                 {barber.rating && (
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-white font-medium">{barber.rating}</span>
                  </div>
                )} */}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {barbers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay barberos disponibles en esta sucursal</p>
        </div>
      )}
          <MobileStepFooter>
        <div className="w-full sm:w-auto">
          <AppButton
            variant="outline"
            fullWidth
            leftIcon={ChevronLeft}
            onClick={onBack}
          >
            Atrás
          </AppButton>
        </div>

        <div className="w-full sm:w-auto">
          <AppButton
            variant="primary"
            fullWidth
            rightIcon={ChevronRight}
            onClick={onNext}
            disabled={!selected}
          >
            Continuar
          </AppButton>
        </div>
      </MobileStepFooter>
    </div>
  );
}
