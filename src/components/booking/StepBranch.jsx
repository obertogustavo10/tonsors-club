import React from "react";
import { Card } from "@radix-ui/themes";
import { MapPin, Phone, Clock, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import MobileStepFooter from "../ui/MobileStepFooter";
import AppButton from "../ui/AppButton";
import { getArgentinaTodayDateString } from "../../service/barberAvailability.api";
import { getBranchScheduleForDate } from "../../service/sucursales.api";

export default function StepBranch({ branches, selected, onSelect, onNext }) {
  const todayDate = getArgentinaTodayDateString();

  return (
    <div className="space-y-6">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-white">Elige tu sucursal</h2>
        <p className="whitespace-nowrap text-[13px] text-slate-400 sm:text-base">
          Selecciona la ubicacion mas conveniente para ti
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {branches.map((branch, index) => {
          const todaySchedule = getBranchScheduleForDate(branch, todayDate);

          return (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer border-2 p-6 transition-all duration-300 ${
                  selected?.id === branch.id
                    ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
                onClick={() => onSelect(branch)}
              >
                <div className="flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white/10">
                    {branch.image_url ? (
                      <img
                        src={branch.image_url}
                        alt={branch.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <MapPin className="h-8 w-8 text-amber-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-semibold text-white">{branch.name}</h3>
                    <div className="space-y-1 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-400" />
                        <span>{branch.address}</span>
                      </div>
                      {branch.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-amber-400" />
                          <span>{branch.phone}</span>
                        </div>
                      )}
                      {todaySchedule && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-400" />
                          <span>
                            Hoy:{" "}
                            {todaySchedule.isOpen
                              ? `${todaySchedule.open} - ${todaySchedule.close}`
                              : "Cerrado"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {branches.length === 0 && (
        <div className="py-12 text-center">
          <MapPin className="mx-auto mb-4 h-12 w-12 text-slate-600" />
          <p className="text-slate-400">No hay sucursales disponibles</p>
        </div>
      )}

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
