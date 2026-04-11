import React, { useMemo, useState } from "react";
import {
  CalendarX,
  User,
  MapPin,
  Scissors,
  Calendar,
  Clock,
  X,
  ChevronRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cancelTurno, updateTurno } from "../../service/turnos.service";

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  completed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const statusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

function formatBookingDate(dateValue) {
  if (!dateValue) return "-";

  try {
    return format(parseISO(dateValue), "d MMM", { locale: es });
  } catch {
    return dateValue;
  }
}

function getBookingCreatedAtValue(booking) {
  const createdAt = booking?.createdAt;

  if (!createdAt) return 0;

  if (typeof createdAt?.toDate === "function") {
    return createdAt.toDate().getTime();
  }

  if (typeof createdAt?.seconds === "number") {
    return createdAt.seconds * 1000;
  }

  if (typeof createdAt === "string" || createdAt instanceof Date) {
    const parsed = new Date(createdAt).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function BookingDetailModal({
  booking,
  branchName,
  serviceName,
  barberName,
  canConfirm,
  canCancel,
  submitting,
  onClose,
  onChangeStatus,
}) {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-900 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Detalle del turno</h3>
            <p className="text-sm text-slate-400">
              {formatBookingDate(booking.date)} - {booking.time || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
              <User className="h-4 w-4 text-amber-400" />
              Cliente
            </div>
            <p className="text-base font-semibold text-white">
              {booking.client_name || booking.clientName || "-"}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {booking.client_email || booking.clientEmail || "-"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {booking.client_phone || booking.clientPhone || "-"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="h-4 w-4 text-amber-400" />
                Sucursal
              </div>
              <p className="text-white">{branchName}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                <Scissors className="h-4 w-4 text-amber-400" />
                Servicio
              </div>
              <p className="text-white">{serviceName}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                <User className="h-4 w-4 text-amber-400" />
                Barbero
              </div>
              <p className="text-white">{barberName}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                <Clock className="h-4 w-4 text-amber-400" />
                Estado
              </div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                  statusColors[booking.status] || statusColors.pending
                }`}
              >
                {statusLabels[booking.status] || booking.status || "Pendiente"}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {canConfirm && booking.status !== "confirmed" && (
              <button
                type="button"
                onClick={() => onChangeStatus(booking, "confirmed")}
                disabled={submitting}
                className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-60"
              >
                Confirmar
              </button>
            )}
            {canCancel && booking.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => onChangeStatus(booking, "cancelled")}
                disabled={submitting}
                className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/25 disabled:opacity-60"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingsTab({
  bookings,
  branches,
  services,
  barbers,
  canManage = false,
  onRefresh,
}) {
  const [submittingId, setSubmittingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const canConfirmBookings = canManage;
  const canCancelBookings = true;

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      return getBookingCreatedAtValue(b) - getBookingCreatedAtValue(a);
    });
  }, [bookings]);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== "cancelled"),
    [bookings]
  );

  const getBranchName = (booking) =>
    booking.branch?.name ||
    branches.find((branch) => branch.id === booking.branch_id)?.name ||
    "-";

  const getServiceName = (booking) =>
    booking.service?.name ||
    services.find((service) => service.id === booking.service_id)?.name ||
    "-";

  const getBarberName = (booking) =>
    booking.barber?.name ||
    barbers.find((barber) => barber.id === booking.barber_id)?.name ||
    (booking.autoAssign ? "Autoasignado" : "Sin asignar");

  const changeStatus = async (booking, status) => {
    try {
      setSubmittingId(booking.id);
      if (status === "cancelled") {
        await cancelTurno(booking);
      } else {
        await updateTurno(booking.firestoreId || booking.id, { status });
      }
      await onRefresh();
      setSelectedBooking((current) =>
        current?.id === booking.id ? { ...current, status } : current
      );
    } catch (error) {
      console.error("Error actualizando turno:", error);
      window.alert("No se pudo actualizar el estado del turno.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {canManage ? "Reservas" : "Mis turnos"}
          </h2>
          <p className="text-slate-400">
            {canManage
              ? "Gestiona las citas creadas desde la app"
              : "Consulta unicamente los turnos que te fueron asignados"}
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-300">
          {activeBookings.length} activas
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {sortedBookings.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarX className="mx-auto mb-4 h-12 w-12 text-slate-600" />
            <p className="text-slate-400">No hay reservas registradas</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {sortedBookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => setSelectedBooking(booking)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left transition-colors hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-white">
                        {booking.client_name || booking.clientName || "-"}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-400">
                        {getServiceName(booking)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                        statusColors[booking.status] || statusColors.pending
                      }`}
                    >
                      {statusLabels[booking.status] || booking.status || "Pendiente"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Fecha
                      </p>
                      <p className="mt-1 text-white">{formatBookingDate(booking.date)}</p>
                      <p className="text-slate-400">{booking.time || "-"}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Barbero
                      </p>
                      <p className="mt-1 text-white">{getBarberName(booking)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-400">
                    <span className="truncate">{getBranchName(booking)}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-amber-300">
                      Ver detalle
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr className="text-left text-sm text-slate-400">
                    <th className="px-4 py-4 font-medium">Cliente</th>
                    <th className="px-4 py-4 font-medium">Sucursal</th>
                    <th className="px-4 py-4 font-medium">Servicio</th>
                    <th className="px-4 py-4 font-medium">Barbero</th>
                    <th className="px-4 py-4 font-medium">Fecha</th>
                    <th className="px-4 py-4 font-medium">Estado</th>
                    {(canConfirmBookings || canCancelBookings) && (
                      <th className="px-4 py-4 font-medium text-right">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {sortedBookings.map((booking) => (
                    <tr key={booking.id} className="align-top text-sm">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <User className="mt-1 h-4 w-4 text-amber-400" />
                          <div>
                            <div className="font-medium text-white">
                              {booking.client_name || booking.clientName || "-"}
                            </div>
                            <div className="text-slate-400">
                              {booking.client_email || booking.clientEmail || "-"}
                            </div>
                            <div className="text-slate-500">
                              {booking.client_phone || booking.clientPhone || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-amber-400" />
                          {getBranchName(booking)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        <div className="flex items-center gap-2">
                          <Scissors className="h-4 w-4 text-amber-400" />
                          {getServiceName(booking)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {getBarberName(booking)}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        <div className="flex items-start gap-2">
                          <Calendar className="mt-1 h-4 w-4 text-amber-400" />
                          <div>
                            <div>{formatBookingDate(booking.date)}</div>
                            <div className="flex items-center gap-1 text-slate-400">
                              <Clock className="h-3 w-3" />
                              {booking.time || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                            statusColors[booking.status] || statusColors.pending
                          }`}
                        >
                          {statusLabels[booking.status] || booking.status || "Pendiente"}
                        </span>
                      </td>
                      {(canConfirmBookings || canCancelBookings) && (
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {canConfirmBookings && booking.status !== "confirmed" && (
                              <button
                                type="button"
                                onClick={() => changeStatus(booking, "confirmed")}
                                disabled={submittingId === booking.id}
                                className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-60"
                              >
                                Confirmar
                              </button>
                            )}
                            {canCancelBookings && booking.status !== "cancelled" && (
                              <button
                                type="button"
                                onClick={() => changeStatus(booking, "cancelled")}
                                disabled={submittingId === booking.id}
                                className="rounded-lg bg-red-500/15 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/25 disabled:opacity-60"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <BookingDetailModal
        booking={selectedBooking}
        branchName={selectedBooking ? getBranchName(selectedBooking) : "-"}
        serviceName={selectedBooking ? getServiceName(selectedBooking) : "-"}
        barberName={selectedBooking ? getBarberName(selectedBooking) : "-"}
        canConfirm={canConfirmBookings}
        canCancel={canCancelBookings}
        submitting={submittingId === selectedBooking?.id}
        onClose={() => setSelectedBooking(null)}
        onChangeStatus={changeStatus}
      />
    </div>
  );
}
