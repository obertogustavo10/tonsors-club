import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, Button } from "@radix-ui/themes";
import { Calendar, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "motion/react";
import {
  SLOT_INTERVAL_MINUTES,
  ensureBarberDaySlots,
  generateTimeSlots,
  getConsecutiveSlots,
  getArgentinaTodayDateString,
  isPastTimeSlot,
} from "../../service/barberAvailability.api";
import {
  getBranchScheduleForDate,
  isBranchOpenOnDate,
} from "../../service/sucursales.api";
import { getServiceDurationMinutes } from "../../service/servicios.api";
import BarberLoader from "../ui/BarberLoader";

function isSlotWithinBranchSchedule(time, schedule) {
  if (!schedule?.isOpen) return false;
  return time >= schedule.open && time < schedule.close;
}

function timeToMinutes(time) {
  const [hours, minutes] = String(time || "")
    .split(":")
    .map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function shouldShowStartTime(time, schedule, serviceDurationMinutes) {
  const slotMinutes = timeToMinutes(time);
  const openMinutes = timeToMinutes(schedule?.open);
  const duration = Number(serviceDurationMinutes);

  if (
    !Number.isFinite(slotMinutes) ||
    !Number.isFinite(openMinutes) ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return false;
  }

  return (slotMinutes - openMinutes) % duration === 0;
}

function buildSlotState(day, dateStr, schedule, serviceDurationMinutes) {
  const blocked = new Set(day?.blockedSlots || []);
  const booked = new Set(day?.bookedSlots || []);
  const branchSlots = generateTimeSlots({
    open: schedule?.open,
    close: schedule?.close,
  });

  return branchSlots.flatMap((time) => {
    if (!shouldShowStartTime(time, schedule, serviceDurationMinutes)) {
      return [];
    }

    const occupiedSlots = getConsecutiveSlots({
      startTime: time,
      durationMinutes: serviceDurationMinutes,
    });
    const fitsBranchSchedule = occupiedSlots.every((slot) =>
      isSlotWithinBranchSchedule(slot, schedule)
    );

    if (!fitsBranchSchedule) {
      return [];
    }

    const isBooked = occupiedSlots.some((slot) => booked.has(slot));
    const isBlocked = occupiedSlots.some((slot) => blocked.has(slot));
    const isPast = isPastTimeSlot({ date: dateStr, time });
    const status = isBooked
      ? "booked"
      : isBlocked
        ? "blocked"
        : isPast
          ? "past"
          : "available";

    return {
      time,
      occupiedSlots,
      status,
      disabled: status !== "available",
    };
  });
}

const statusStyles = {
  available: "bg-white/5 text-white hover:bg-white/10 border-white/10",
  booked:
    "bg-red-500/10 text-red-200 border-red-500/20 opacity-70 line-through cursor-not-allowed",
  blocked:
    "bg-slate-700/40 text-slate-300 border-slate-600/40 opacity-75 line-through cursor-not-allowed",
  past:
    "bg-slate-800/60 text-slate-500 border-slate-700/40 opacity-70 line-through cursor-not-allowed",
};

const statusLegend = [
  { id: "available", label: "Disponible", tone: "bg-emerald-400" },
  { id: "booked", label: "Tomado", tone: "bg-red-400" },
  { id: "blocked", label: "Bloqueado", tone: "bg-slate-400" },
  { id: "past", label: "Pasado", tone: "bg-slate-600" },
];

export default function StepDateTime({
  branch,
  service,
  barbers,
  selectedDate,
  selectedTime,
  onSelect,
  onNext,
  onBack,
}) {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchClosedMessage, setBranchClosedMessage] = useState("");
  const requestIdRef = useRef(0);
  const serviceDurationMinutes = useMemo(
    () => getServiceDurationMinutes(service) || SLOT_INTERVAL_MINUTES,
    [service]
  );

  const availableDates = useMemo(() => {
    const today = parseISO(getArgentinaTodayDateString());
    const dates = [];

    for (let i = 0; i < 31; i++) {
      const nextDate = addDays(today, i);
      if (isBranchOpenOnDate(branch, nextDate)) {
        dates.push(nextDate);
      }
    }

    return dates;
  }, [branch]);

  const loadDaySlots = async (dateStr, keepSelectedTime = "") => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);

    if (!barbers?.id || barbers?.available === false) {
      if (requestIdRef.current !== requestId) return;
      setTimeSlots([]);
      setBranchClosedMessage("");
      setLoading(false);
      return;
    }

    const branchSchedule = getBranchScheduleForDate(branch, dateStr);
    if (!branchSchedule?.isOpen) {
      if (requestIdRef.current !== requestId) return;
      setTimeSlots([]);
      setBranchClosedMessage("La sucursal no atiende en la fecha seleccionada.");
      onSelect(dateStr, "");
      setLoading(false);
      return;
    }

    setBranchClosedMessage("");

    try {
      const day = await ensureBarberDaySlots({
        barberId: barbers?.id,
        branchId: branch?.id,
        date: dateStr,
      });
      if (requestIdRef.current !== requestId) return;

      const nextSlots = buildSlotState(
        day,
        dateStr,
        branchSchedule,
        serviceDurationMinutes
      );
      const keepTimeIsValid = nextSlots.some(
        (slot) => slot.time === keepSelectedTime && !slot.disabled
      );

      setTimeSlots(nextSlots);
      onSelect(dateStr, keepTimeIsValid ? keepSelectedTime : "");
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      console.log("Error fetching availability:", error);
      setTimeSlots([]);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const fallbackDate =
      availableDates.length > 0
        ? format(availableDates[0], "yyyy-MM-dd")
        : getArgentinaTodayDateString();
    const dateStr =
      selectedDate && isBranchOpenOnDate(branch, selectedDate)
        ? selectedDate
        : fallbackDate;

    loadDaySlots(dateStr, selectedTime || "");
  }, [
    barbers?.id,
    barbers?.available,
    selectedDate,
    branch?.id,
    availableDates,
    serviceDurationMinutes,
  ]);

  const handleDateSelect = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (dateStr === selectedDate) return;
    setLoading(true);
    onSelect(dateStr, "");
  };

  const handleTimeSelect = (slot) => {
    if (slot.disabled) return;
    onSelect(selectedDate, slot.time);
  };

  const selectedDateObj = selectedDate ? parseISO(selectedDate) : null;
  const selectedBranchSchedule = selectedDate
    ? getBranchScheduleForDate(branch, selectedDate)
    : null;
  const availableCount = timeSlots.filter(
    (slot) => slot.status === "available"
  ).length;

  return (
    <div className="space-y-6">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-white">Elige fecha y hora</h2>
        <p className="text-slate-400">Selecciona el momento ideal para tu cita</p>
      </div>

      <Card className="border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Fecha</h3>
        </div>

        {availableDates.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">
            La sucursal seleccionada no tiene dias habilitados para reservar.
          </div>
        ) : (
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
            {availableDates.map((date, index) => {
              const isSelected =
                selectedDateObj && isSameDay(date, selectedDateObj);
              const isToday =
                format(date, "yyyy-MM-dd") === getArgentinaTodayDateString();

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleDateSelect(date)}
                  className={`w-16 flex-shrink-0 rounded-xl py-3 text-center transition-all ${
                    isSelected
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                      : "bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  <div className="text-xs uppercase opacity-70">
                    {format(date, "EEE", { locale: es })}
                  </div>
                  <div className="text-xl font-bold">{format(date, "d")}</div>
                  <div className="text-xs opacity-70">
                    {format(date, "MMM", { locale: es })}
                  </div>
                  {isToday && (
                    <div className="text-[10px] font-semibold text-amber-400">
                      Hoy
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </Card>

      {selectedDate && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">Hora</h3>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-300">
              {statusLegend.map((item) => (
                <div
                  key={item.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                  {item.label}
                </div>
              ))}
            </div>

            {selectedBranchSchedule?.isOpen && (
              <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Horario de la sucursal para este dia: {selectedBranchSchedule.open} -{" "}
                {selectedBranchSchedule.close} | Servicio: {serviceDurationMinutes} min
              </div>
            )}

            {loading ? (
              <BarberLoader
                show={loading}
                label="Buscando horarios disponibles"
                size="md"
              />
            ) : barbers?.available === false ? (
              <div className="py-8 text-center text-slate-400">
                Este barbero no se encuentra disponible actualmente.
              </div>
            ) : branchClosedMessage ? (
              <div className="py-8 text-center text-slate-400">
                {branchClosedMessage}
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No hay horarios configurados para esta fecha.
              </div>
            ) : (
              <>
                <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                  {availableCount > 0
                    ? `${availableCount} horarios disponibles para reservar`
                    : "Ya no quedan horarios disponibles para esta fecha"}
                </div>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
                  {timeSlots.map((slot, index) => {
                    const isSelected =
                      selectedTime === slot.time && !slot.disabled;

                    return (
                      <motion.button
                        key={slot.time}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleTimeSelect(slot)}
                        disabled={slot.disabled}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                            : statusStyles[slot.status]
                        }`}
                      >
                        <div>{slot.time}</div>
                        {slot.status !== "available" && (
                          <div className="mt-1 text-[10px] uppercase tracking-wide">
                            {slot.status === "booked"
                              ? "Tomado"
                              : slot.status === "blocked"
                                ? "Bloqueado"
                                : "Pasado"}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </motion.div>
      )}

      <div className="flex justify-between pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="rounded-xl border-white/20 px-6 py-3 text-white hover:bg-white/10"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Atras
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedDate || !selectedTime || Boolean(branchClosedMessage)}
          className="rounded-xl bg-amber-500 px-8 py-3 font-semibold text-black hover:bg-amber-600 disabled:opacity-50"
        >
          Continuar
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
