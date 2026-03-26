import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Lock, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import FullPageLoader from "../ui/FullPageLoader";
import {
  DEFAULT_TIME_SLOTS,
  computeAvailableSlots,
  ensureBarberDaySlots,
  filterFutureSlots,
  isPastTimeSlot,
  setManualBlockedSlots,
} from "../../service/barberAvailability.api";

function getTodayDate() {
  return format(new Date(), "yyyy-MM-dd");
}

export default function AvailabilityTab({
  canManage = false,
  barbers = [],
  selectedBarber = null,
}) {
  const [activeBarberId, setActiveBarberId] = useState(selectedBarber?.id || "");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [daySlots, setDaySlots] = useState(null);
  const [selectedBlockedSlots, setSelectedBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedBarber?.id) {
      setActiveBarberId(selectedBarber.id);
    }
  }, [selectedBarber?.id]);

  const activeBarber = useMemo(() => {
    if (selectedBarber?.id && !canManage) return selectedBarber;
    return barbers.find((barber) => barber.id === activeBarberId) || null;
  }, [activeBarberId, barbers, canManage, selectedBarber]);

  const loadDaySlots = async () => {
    if (!activeBarber?.id || !selectedDate) {
      setDaySlots(null);
      setSelectedBlockedSlots([]);
      return;
    }

    try {
      setLoading(true);
      const nextDaySlots = await ensureBarberDaySlots({
        barberId: activeBarber.id,
        branchId: activeBarber.branch_id,
        date: selectedDate,
      });
      setDaySlots(nextDaySlots);
      setSelectedBlockedSlots(nextDaySlots.blockedSlots || []);
    } catch (error) {
      console.error("Error cargando bloqueos del dia:", error);
      window.alert("No se pudo cargar la disponibilidad del dia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDaySlots();
  }, [activeBarber?.id, selectedDate]);

  const toggleBlockedSlot = async (time) => {
    if (daySlots?.bookedSlots?.includes(time)) return;
    if (!activeBarber?.id || !selectedDate) return;

    const nextBlockedSlots = selectedBlockedSlots.includes(time)
      ? selectedBlockedSlots.filter((slot) => slot !== time)
      : [...selectedBlockedSlots, time];

    setSelectedBlockedSlots(nextBlockedSlots);

    try {
      setSaving(true);
      const updatedDaySlots = await setManualBlockedSlots({
        barberId: activeBarber.id,
        branchId: activeBarber.branch_id,
        date: selectedDate,
        times: nextBlockedSlots,
      });
      setDaySlots(updatedDaySlots);
      setSelectedBlockedSlots(updatedDaySlots.blockedSlots || []);
    } catch (error) {
      console.error("Error guardando bloqueos manuales:", error);
      window.alert("No se pudieron guardar los bloqueos.");
      setSelectedBlockedSlots(daySlots?.blockedSlots || []);
    } finally {
      setSaving(false);
    }
  };

  const availableSlots = computeAvailableSlots({
    blockedSlots: selectedBlockedSlots,
    bookedSlots: daySlots?.bookedSlots || [],
  });
  const futureAvailableSlots = filterFutureSlots({
    date: selectedDate,
    slots: availableSlots,
  });

  if (!canManage && !selectedBarber) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 text-slate-600" />
        <p className="text-slate-400">No se encontro el perfil del barbero.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FullPageLoader
        show={saving}
        label="Guardando disponibilidad"
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {canManage ? "Bloqueos manuales" : "Mis bloqueos"}
          </h2>
          <p className="text-slate-400">
            Marca horarios no laborables sin afectar la logica de reservas ya existente.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-300">
          {futureAvailableSlots.length} horarios libres
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Configuracion</h3>
          </div>

          {canManage && (
            <div className="mb-4">
              <label className="mb-2 block text-sm text-slate-300">Barbero</label>
              <select
                value={activeBarberId}
                onChange={(event) => setActiveBarberId(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
              >
                <option value="">Seleccionar barbero</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="mb-2 block text-sm text-slate-300">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
            />
          </div>

          {activeBarber && (
            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4 text-sm">
              <p className="font-semibold text-white">{activeBarber.name}</p>
              <p className="mt-1 text-slate-400">
                {activeBarber.available === false
                  ? "Este barbero esta marcado como no disponible globalmente."
                  : "Disponible globalmente. Aqui solo se bloquean horarios puntuales."}
              </p>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
            Los cambios se guardan automaticamente al bloquear o habilitar cada horario.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Horarios del dia</h3>
          </div>

          {!activeBarber?.id ? (
            <p className="py-8 text-center text-slate-400">
              Selecciona un barbero para gestionar sus bloqueos.
            </p>
          ) : loading ? (
            <p className="py-8 text-center text-slate-400">Cargando horarios...</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {DEFAULT_TIME_SLOTS.map((time) => {
                  const isBooked = daySlots?.bookedSlots?.includes(time);
                  const isBlocked = selectedBlockedSlots.includes(time);
                  const isPast = isPastTimeSlot({ date: selectedDate, time });

                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => toggleBlockedSlot(time)}
                      disabled={isBooked || isPast}
                      className={`rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                        isBooked
                          ? "cursor-not-allowed border border-blue-500/30 bg-blue-500/10 text-blue-200"
                          : isPast
                            ? "cursor-not-allowed border border-slate-700 bg-slate-800/70 text-slate-500 line-through"
                          : isBlocked
                            ? "border border-red-500/30 bg-red-500/15 text-red-200"
                            : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Reservados</p>
                  <p className="mt-2 text-lg font-semibold text-blue-200">
                    {daySlots?.bookedSlots?.length || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Bloqueados</p>
                  <p className="mt-2 text-lg font-semibold text-red-200">
                    {selectedBlockedSlots.length}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Disponibles</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-200">
                    {futureAvailableSlots.length}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Disponible
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-300">
                  <Lock className="h-4 w-4 text-red-400" />
                  Bloqueado manualmente
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-300">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Reservado por cliente
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-300">
                  <Clock className="h-4 w-4 text-slate-500" />
                  Horario ya pasado
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
