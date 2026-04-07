import React, { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Plus, Scissors, User, X } from "lucide-react";
import { createTurno } from "../../service/turnos.service";
import {
  ensureBarberDaySlots,
  generateTimeSlots,
  getConsecutiveSlots,
  getArgentinaTodayDateString,
  isPastTimeSlot,
  reserveSlotAtomic,
  SLOT_INTERVAL_MINUTES,
} from "../../service/barberAvailability.api";
import { getServiceDurationMinutes } from "../../service/servicios.api";
import { getBranchScheduleForDate } from "../../service/sucursales.api";

function isSlotWithinBranchSchedule(time, schedule) {
  if (!schedule?.isOpen) return false;
  return time >= schedule.open && time < schedule.close;
}

function shouldShowStartTime(time, schedule, serviceDurationMinutes) {
  const slotMinutes = toMinutes(time);
  const openMinutes = toMinutes(schedule?.open);
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

function buildTimeOptions(day, dateStr, schedule, serviceDurationMinutes) {
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

    if (!fitsBranchSchedule) return [];

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

    return [
      {
        time,
        occupiedSlots,
        status,
        disabled: status !== "available",
      },
    ];
  });
}

function toMinutes(time) {
  const [hours, minutes] = String(time || "")
    .split(":")
    .map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function toTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getEndTime(startTime, durationMinutes) {
  const startMinutes = toMinutes(startTime);
  const duration = Number(durationMinutes);

  if (!Number.isFinite(startMinutes) || !Number.isFinite(duration)) {
    return startTime;
  }

  return toTime(startMinutes + duration);
}

const slotStyles = {
  available: "border-white/10 bg-white/5 text-white hover:bg-white/10",
  booked:
    "border-blue-500/30 bg-blue-500/10 text-blue-200 opacity-80 line-through cursor-not-allowed",
  blocked:
    "border-red-500/30 bg-red-500/15 text-red-200 opacity-80 line-through cursor-not-allowed",
  past:
    "border-slate-700 bg-slate-800/70 text-slate-500 opacity-80 line-through cursor-not-allowed",
};

function createInitialForm() {
  return {
    barberId: "",
    serviceId: "",
    date: getArgentinaTodayDateString(),
    time: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
  };
}

export default function ManualBookingFab({
  canManage = false,
  barbers = [],
  branches = [],
  services = [],
  selectedBarber = null,
  onCreated,
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(createInitialForm);
  const [timeOptions, setTimeOptions] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    setForm((prev) => ({
      ...createInitialForm(),
      barberId: canManage ? prev.barberId : selectedBarber?.id || "",
    }));
    setTimeOptions([]);
    setSlotsMessage("");
  }, [open, canManage, selectedBarber?.id]);

  const activeBarber = useMemo(() => {
    const targetId = canManage ? form.barberId : selectedBarber?.id;
    return barbers.find((barber) => barber.id === targetId) || selectedBarber || null;
  }, [barbers, canManage, form.barberId, selectedBarber]);

  const activeService = useMemo(
    () => services.find((service) => service.id === form.serviceId) || null,
    [form.serviceId, services]
  );

  const activeBranch = useMemo(
    () =>
      branches.find(
        (branch) =>
          branch.id === activeBarber?.branch_id ||
          branch.firestoreId === activeBarber?.branch_id
      ) || null,
    [activeBarber?.branch_id, branches]
  );

  const serviceDurationMinutes = useMemo(
    () => getServiceDurationMinutes(activeService) || SLOT_INTERVAL_MINUTES,
    [activeService]
  );

  useEffect(() => {
    if (!open || !activeBarber?.id || !activeService || !form.date) {
      setTimeOptions([]);
      setSlotsMessage("");
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoadingSlots(true);

    const loadSlots = async () => {
      try {
        const branchSchedule = getBranchScheduleForDate(activeBranch, form.date);
        if (!branchSchedule?.isOpen) {
          if (requestIdRef.current !== requestId) return;
          setTimeOptions([]);
          setSlotsMessage("La sucursal no atiende en esa fecha.");
          return;
        }

        const day = await ensureBarberDaySlots({
          barberId: activeBarber.id,
          branchId: activeBarber.branch_id,
          date: form.date,
        });
        if (requestIdRef.current !== requestId) return;

        const nextOptions = buildTimeOptions(
          day,
          form.date,
          branchSchedule,
          serviceDurationMinutes
        );

        setTimeOptions(nextOptions);
        const nextAvailableStarts = nextOptions.filter(
          (item) => item.status === "available"
        );
        setSlotsMessage(
          nextAvailableStarts.length === 0
            ? "No hay horarios disponibles para este servicio."
            : ""
        );
        setForm((prev) => ({
          ...prev,
          time: nextAvailableStarts.some((item) => item.time === prev.time)
            ? prev.time
            : "",
        }));
      } catch (error) {
        if (requestIdRef.current !== requestId) return;
        console.error("Error cargando horarios manuales:", error);
        setTimeOptions([]);
        setSlotsMessage("No se pudieron cargar los horarios.");
      } finally {
        if (requestIdRef.current === requestId) {
          setLoadingSlots(false);
        }
      }
    };

    loadSlots();
  }, [
    open,
    activeBarber?.id,
    activeBarber?.branch_id,
    activeBranch,
    activeService,
    form.date,
    serviceDurationMinutes,
  ]);

  const handleClose = () => {
    setOpen(false);
    setSubmitting(false);
    setLoadingSlots(false);
    setTimeOptions([]);
    setSlotsMessage("");
    setForm(createInitialForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeBarber || !activeService || !activeBranch || !form.time) return;

    try {
      setSubmitting(true);
      const occupiedSlots =
        timeOptions.find((slot) => slot.time === form.time)?.occupiedSlots ||
        getConsecutiveSlots({
          startTime: form.time,
          durationMinutes: serviceDurationMinutes,
        });

      await reserveSlotAtomic({
        barberId: activeBarber.id,
        branchId: activeBranch.id,
        date: form.date,
        time: form.time,
        times: occupiedSlots,
      });

      await createTurno({
        id: `manual_${Date.now()}`,
        branch: activeBranch,
        branch_id: activeBranch.id,
        service: activeService,
        service_id: activeService.id,
        barber: activeBarber,
        barber_id: activeBarber.id,
        barbero_email: activeBarber.email || null,
        autoAssign: false,
        date: form.date,
        time: form.time,
        end_time: getEndTime(form.time, serviceDurationMinutes),
        duration_minutes: serviceDurationMinutes,
        occupied_slots: occupiedSlots,
        client_name: form.clientName,
        client_email: form.clientEmail,
        client_phone: form.clientPhone,
        status: "confirmed",
        source: "panel",
      });

      await onCreated?.();
      handleClose();
    } catch (error) {
      console.error("Error creando turno manual:", error);
      window.alert(error?.message || "No se pudo crear el turno.");
    } finally {
      setSubmitting(false);
    }
  };

  const isValid =
    Boolean(activeBarber?.id) &&
    Boolean(activeService?.id) &&
    Boolean(form.date) &&
    Boolean(form.time) &&
    Boolean(form.clientName.trim()) &&
    Boolean(form.clientPhone.trim()) &&
    Boolean(form.clientEmail.trim());

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-black shadow-lg shadow-amber-500/30 transition hover:bg-amber-400"
      >
        <Plus className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-900 shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Crear turno manual</h3>
                <p className="text-sm text-slate-400">
                  Reserva un turno desde el panel respetando disponibilidad real.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 overflow-y-auto px-4 py-4 sm:px-6"
            >
              {canManage && (
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Barbero</label>
                  <select
                    value={form.barberId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        barberId: event.target.value,
                        time: "",
                      }))
                    }
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Servicio</label>
                  <select
                    value={form.serviceId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        serviceId: event.target.value,
                        time: "",
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                  >
                    <option value="">Seleccionar servicio</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Duracion</label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white">
                    <Clock3 className="h-4 w-4 text-amber-400" />
                    {serviceDurationMinutes} min
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Fecha</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        date: event.target.value,
                        time: "",
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Sucursal</label>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white">
                    {activeBranch?.name || "Selecciona un barbero"}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Hora</label>
                {loadingSlots ? (
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">
                    Cargando horarios disponibles...
                  </div>
                ) : slotsMessage ? (
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">
                    {slotsMessage}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {timeOptions.map((slot) => {
                      const isSelected =
                        form.time === slot.time && slot.status === "available";

                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() =>
                            !slot.disabled &&
                            setForm((prev) => ({ ...prev, time: slot.time }))
                          }
                          disabled={slot.disabled}
                          className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                            isSelected
                              ? "border-amber-500 bg-amber-500 text-black"
                              : slotStyles[slot.status]
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
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Nombre del cliente
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      value={form.clientName}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          clientName: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Telefono
                  </label>
                  <input
                    value={form.clientPhone}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        clientPhone: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Correo</label>
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      clientEmail: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </div>
            </form>

            <div className="border-t border-white/10 px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isValid || submitting || loadingSlots}
                  className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60"
                >
                  {submitting ? "Creando..." : "Crear turno"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
