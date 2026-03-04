import React from 'react';
import { Card, Button } from "@radix-ui/themes";
import { MapPin, Phone, Clock, ChevronRight } from 'lucide-react';
import { motion } from "motion/react";
import MobileStepFooter from "../ui/MobileStepFooter";
import AppButton from "../ui/AppButton";


export default function StepBranch({ branches, selected, onSelect, onNext }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Elige tu sucursal</h2>
        <p className="text-slate-400">Selecciona la ubicación más conveniente para ti</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch, index) => (
          <motion.div
            key={branch.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`p-6 cursor-pointer transition-all duration-300 border-2 ${
                selected?.id === branch.id
                  ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
              onClick={() => onSelect(branch)}
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                  {branch.image_url ? (
                    <img
                      src={branch.image_url}
                      alt={branch.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-amber-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{branch.name}</h3>
                  <div className="space-y-1 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>{branch.address}</span>
                    </div>
                    {branch.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-amber-400" />
                        <span>{branch.phone}</span>
                      </div>
                    )}
                    {branch.opening_hour !== undefined && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>{branch.opening_hour}:00 - {branch.closing_hour}:00</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay sucursales disponibles</p>
        </div>
      )}

{/*       <div className="flex justify-end pt-6">
        <Button
          onClick={onNext}
          disabled={!selected}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3 rounded-xl disabled:opacity-50"
        >
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div> */}
            <MobileStepFooter>
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