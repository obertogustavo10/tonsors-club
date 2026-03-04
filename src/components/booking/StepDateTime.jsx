import React, { useState, useMemo, useEffect } from "react";
import { Card, Button } from "@radix-ui/themes";
import { Calendar, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { format, addDays, isSameDay, parseISO, set } from "date-fns";
import { es, fi, vi } from "date-fns/locale";
import { motion } from "motion/react";
import {
  ensureBarberDaySlots,
  computeAvailableSlots,
} from "../../service/barberAvailability.api";
import { view } from "motion/react-client";
import BarberLoader from "../ui/BarberLoader";
export default function StepDateTime({
  branch,
  barbers,
  selectedDate,
  selectedTime,
  onSelect,
  onNext,
  onBack,
}) {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate next 14 days
  const availableDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 31; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  }, []);
  useEffect(() => {
    const fetchDatos = async () => {
      setLoading(true);
      try {
        const dateStr = format(new Date(), "yyyy-MM-dd");
        onSelect(dateStr, selectedTime);
        const day = await ensureBarberDaySlots({
          barberId: barbers?.id,
          branchId: branch?.id,
          date: dateStr,
        });
        console.log("Selected date:", day);
        const availableSlots = computeAvailableSlots(day);
        setTimeSlots(availableSlots);
      } catch (error) {
        console.log("Error fetching availability:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, []);
  const handleDateSelect = async (date) => {
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      onSelect(dateStr, selectedTime);
      const day = await ensureBarberDaySlots({
        barberId: barbers?.id,
        branchId: branch?.id,
        date: dateStr,
      });
      console.log("Selected date:", day);
      const availableSlots = computeAvailableSlots(day);
      setTimeSlots(availableSlots);
    } catch (error) {
      console.log("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleTimeSelect = (time) => {
    onSelect(selectedDate, time);
  };
  const selectedDateObj = selectedDate ? parseISO(selectedDate) : null;
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Elige fecha y hora
        </h2>
        <p className="text-slate-400">
          Selecciona el momento ideal para tu cita
        </p>
      </div>

      {/* Date Selection */}
      <Card className="bg-white/5 border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Fecha</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {availableDates.map((date, index) => {
            const isSelected =
              selectedDateObj && isSameDay(date, selectedDateObj);
            const isToday = isSameDay(date, new Date());

            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleDateSelect(date)}
                className={`flex-shrink-0 w-16 py-3 rounded-xl text-center transition-all ${
                  isSelected
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                    : "bg-white/5 text-white hover:bg-white/10"
                }`}>
                <div className="text-xs uppercase opacity-70">
                  {format(date, "EEE", { locale: es })}
                </div>
                <div className="text-xl font-bold">{format(date, "d")}</div>
                <div className="text-xs opacity-70">
                  {format(date, "MMM", { locale: es })}
                </div>
                {isToday && (
                  <div className="text-[10px] text-amber-400 font-semibold">
                    Hoy
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* Time Selection */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">Hora</h3>
            </div>
            {loading ? (
              <BarberLoader
                show={loading}
                label="Buscando horarios disponibles"
                size="md"
              />
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {timeSlots.map((time, index) => {
                  const isSelected = selectedTime === time;
                  return (
                    <motion.button
                      key={time}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleTimeSelect(time)}
                      //disabled={!isAvailable}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                          : "bg-white/5 text-white hover:bg-white/10"
                      }`}>
                      {time}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      <div className="flex justify-between pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-xl">
          <ChevronLeft className="w-5 h-5 mr-2" />
          Atrás
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedDate || !selectedTime}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3 rounded-xl disabled:opacity-50">
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
