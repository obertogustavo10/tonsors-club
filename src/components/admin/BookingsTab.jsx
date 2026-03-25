import React, { useMemo, useState } from "react";
import {
  CalendarX,
  User,
  MapPin,
  Scissors,
  Calendar,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { updateTurno } from "../../service/turnos.service";

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

export default function BookingsTab({
  bookings,
  branches,
  services,
  barbers,
  onRefresh,
}) {
  const [submittingId, setSubmittingId] = useState(null);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aDate = `${a.date || ""} ${a.time || ""}`.trim();
      const bDate = `${b.date || ""} ${b.time || ""}`.trim();
      return bDate.localeCompare(aDate);
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
      await updateTurno(booking.id, { status });
      await onRefresh();
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
          <h2 className="text-2xl font-bold text-white">Reservas</h2>
          <p className="text-slate-400">
            Gestiona las citas creadas desde la app
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-300">
          {activeBookings.length} activas
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {sortedBookings.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarX className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No hay reservas registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="text-left text-sm text-slate-400">
                  <th className="px-4 py-4 font-medium">Cliente</th>
                  <th className="px-4 py-4 font-medium">Sucursal</th>
                  <th className="px-4 py-4 font-medium">Servicio</th>
                  <th className="px-4 py-4 font-medium">Barbero</th>
                  <th className="px-4 py-4 font-medium">Fecha</th>
                  <th className="px-4 py-4 font-medium">Estado</th>
                  <th className="px-4 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sortedBookings.map((booking) => (
                  <tr key={booking.id} className="align-top text-sm">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 mt-1 text-amber-400" />
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
                        <MapPin className="w-4 h-4 text-amber-400" />
                        {getBranchName(booking)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-amber-400" />
                        {getServiceName(booking)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {getBarberName(booking)}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 mt-1 text-amber-400" />
                        <div>
                          <div>{formatBookingDate(booking.date)}</div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
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
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {booking.status !== "confirmed" && (
                          <button
                            type="button"
                            onClick={() => changeStatus(booking, "confirmed")}
                            disabled={submittingId === booking.id}
                            className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-60"
                          >
                            Confirmar
                          </button>
                        )}
                        {booking.status !== "cancelled" && (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
