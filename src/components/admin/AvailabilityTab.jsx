import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Lock, ShieldCheck } from "lucide-react";
import FullPageLoader from "../ui/FullPageLoader";
import {
  computeAvailableSlots,
  ensureBarberDaySlots,
  filterFutureSlots,
  generateTimeSlots,
  getArgentinaTodayDateString,
  getConsecutiveSlots,
  isPastTimeSlot,
  setManualBlockedSlots,
  SLOT_INTERVAL_MINUTES,
} from "../../service/barberAvailability.api";
import { getServiceDurationMinutes } from "../../service/servicios.api";
import { getBranchScheduleForDate } from "../../service/sucursales.api";

function getTodayDate() {
  return getArgentinaTodayDateString();
}

function getBookingOccupiedSlots(booking) {
  if (Array.isArray(booking?.occupied_slots) && booking.occupied_slots.length > 0) {
    return booking.occupied_slots;
  }

  const durationMinutes =
    booking?.duration_minutes ||
    getServiceDurationMinutes(booking?.service) ||
    SLOT_INTERVAL_MINUTES;

  return getConsecutiveSlots({
    startTime: booking?.time,
    durationMinutes,
  });
}

function getBookingDurationMinutes(booking) {
  return (
    booking?.duration_minutes ||
    getServiceDurationMinutes(booking?.service) ||
    SLOT_INTERVAL_MINUTES
  );
}

function buildBookedSlotMap(bookedSlots = [], bookings = []) {
  const slotMap = new Map();
  const bookingEntriesBySlot = new Map();

  bookings.forEach((booking) => {
    const occupiedSlots = getBookingOccupiedSlots(booking);
    const durationMinutes = getBookingDurationMinutes(booking);
    const serviceName = booking?.service?.name || "Turno reservado";
    const clientName = booking?.client_name || "Cliente";
    const label = `${serviceName} - ${clientName}`;

    occupiedSlots.forEach((slot, index) => {
      bookingEntriesBySlot.set(slot, {
        bookingId: booking?.firestoreId || booking?.id || `${booking?.date}_${slot}`,
        label,
        serviceName,
        clientName,
        durationMinutes,
        position: occupiedSlots.length === 1
          ? "single"
          : index === 0
            ? "start"
            : index === occupiedSlots.length - 1
              ? "end"
              : "middle",
        size: occupiedSlots.length,
      });
    });
  });

  bookedSlots.forEach((slot) => {
    slotMap.set(
      slot,
      bookingEntriesBySlot.get(slot) || {
        bookingId: `booked_${slot}`,
        label: "Turno reservado",
        serviceName: "Turno reservado",
        clientName: "Cliente",
        durationMinutes: SLOT_INTERVAL_MINUTES,
        position: "single",
        size: 1,
      }
    );
  });

  return slotMap;
}

function getBookedSlotClasses(position) {
  switch (position) {
    case "start":
      return "border-blue-400 bg-blue-500/15 text-blue-100 ring-1 ring-blue-400/40";
    case "middle":
      return "border-blue-500/30 bg-blue-500/10 text-blue-100";
    case "end":
      return "border-blue-400 bg-blue-500/15 text-blue-100 ring-1 ring-blue-400/40";
    case "single":
    default:
      return "border-blue-400 bg-blue-500/15 text-blue-100 ring-1 ring-blue-400/40";
  }
}

export default function AvailabilityTab({
  canManage = false,
  barbers = [],
  branches = [],
  bookings = [],
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

  const activeBranch = useMemo(
    () =>
      branches.find(
        (branch) =>
          branch.id === activeBarber?.branch_id ||
          branch.firestoreId === activeBarber?.branch_id
      ) || null,
    [activeBarber?.branch_id, branches]
  );

  const branchSchedule = useMemo(
    () => getBranchScheduleForDate(activeBranch, selectedDate),
    [activeBranch, selectedDate]
  );

  const allDaySlots = useMemo(() => {
    if (!branchSchedule?.isOpen) return [];

    return generateTimeSlots({
      open: branchSchedule.open,
      close: branchSchedule.close,
    });
  }, [branchSchedule]);

  const dayBookings = useMemo(() => {
    if (!activeBarber?.id || !selectedDate) return [];

    return bookings.filter((booking) => {
      const bookingBarberId = booking?.barber_id || booking?.barber?.id;
      return (
        bookingBarberId === activeBarber.id &&
        booking?.date === selectedDate &&
        booking?.status !== "cancelled"
      );
    });
  }, [activeBarber?.id, bookings, selectedDate]);

  const bookedSlots = useMemo(() => daySlots?.bookedSlots || [], [daySlots?.bookedSlots]);
  const bookedSlotMap = useMemo(
    () => buildBookedSlotMap(bookedSlots, dayBookings),
    [bookedSlots, dayBookings]
  );

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
    if (bookedSlotMap.has(time)) return;
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
    bookedSlots,
    allSlots: allDaySlots,
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
      <FullPageLoader show={saving} label="Guardando disponibilidad" />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {canManage ? "Bloqueos manuales" : "Mis bloqueos"}
          </h2>
          <p className="text-slate-400">
            Gestiona bloques de 15 minutos y visualiza los turnos tomados como grupos.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-300">
          {futureAvailableSlots.length} bloques libres
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

          {branchSchedule?.isOpen ? (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Horario de la sucursal: {branchSchedule.open} - {branchSchedule.close}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
              La sucursal no atiende en esta fecha.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Bloques del dia</h3>
          </div>

          {!activeBarber?.id ? (
            <p className="py-8 text-center text-slate-400">
              Selecciona un barbero para gestionar sus bloqueos.
            </p>
          ) : loading ? (
            <p className="py-8 text-center text-slate-400">Cargando bloques...</p>
          ) : !branchSchedule?.isOpen ? (
            <p className="py-8 text-center text-slate-400">
              La sucursal permanece cerrada en esta fecha.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {allDaySlots.map((time) => {
                  const bookedMeta = bookedSlotMap.get(time);
                  const isBooked = Boolean(bookedMeta);
                  const isBlocked = selectedBlockedSlots.includes(time);
                  const isPast = isPastTimeSlot({ date: selectedDate, time });
                  const buttonTitle = isBooked
                    ? `${bookedMeta.label} · ${bookedMeta.size} bloque(s)`
                    : time;

                  return (
                    <button
                      key={time}
                      type="button"
                      title={buttonTitle}
                      onClick={() => toggleBlockedSlot(time)}
                      disabled={isBooked || isPast}
                      className={`relative min-h-[68px] rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${
                        isBooked
                          ? getBookedSlotClasses(bookedMeta.position)
                          : isPast
                            ? "cursor-not-allowed border-slate-700 bg-slate-800/70 text-slate-500 line-through"
                            : isBlocked
                              ? "border-red-500/30 bg-red-500/15 text-red-200"
                              : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      <div>{time}</div>
                      {isBooked && bookedMeta.position === "start" && (
                        <div className="mt-1 rounded-md bg-blue-950/60 px-1.5 py-1 text-[10px] leading-tight text-blue-100">
                          Turno de {bookedMeta.durationMinutes} min
                        </div>
                      )}
                      {isBlocked && (
                        <div className="mt-1 text-[10px] uppercase tracking-wide">
                          Bloqueado
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Reservados</p>
                  <p className="mt-2 text-lg font-semibold text-blue-200">
                    {bookedSlots.length}
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
