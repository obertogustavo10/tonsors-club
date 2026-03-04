import React from 'react';
import { Card, Button } from "@radix-ui/themes";
import { Scissors, Clock, DollarSign, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from "motion/react";
import MobileStepFooter from "../ui/MobileStepFooter";
import AppButton from "../ui/AppButton";
export default function StepService({ services, selected, onSelect, onNext, onBack }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Elige tu servicio</h2>
        <p className="text-slate-400">¿Qué te gustaría hacerte hoy?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
              whileHover={{ y: -3 }}

          >
            <Card
              className={`p-6 cursor-pointer transition-all duration-300 border-2 h-full ${
                selected?.id === service.id
                  ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
              onClick={() => onSelect(service)}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Scissors className="w-8 h-8 text-amber-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-slate-400 mb-4">{service.description}</p>
                )}
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-semibold">
                  
                    <span>{service.price}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <Scissors className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay servicios disponibles</p>
        </div>
      )}
{/* 
      <div className="flex justify-between pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-xl"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Atrás
        </Button>
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