import React, { useMemo, useEffect } from "react";
import confetti from "canvas-confetti";
import { Card, Button } from "@radix-ui/themes";
import {
  CheckCircle2,
  MapPin,
  Scissors,
  Calendar,
  Clock,
  User,
  Mail,
  CalendarPlus,
  ArrowRight,
} from "lucide-react";
import { format, parseISO, addMinutes, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "motion/react";

function getDurationMinutes(service) {
  // ✅ prioridad: número real
  if (typeof service?.durationMinutes === "number")
    return service.durationMinutes;
  if (typeof service?.duration === "number") return service.duration;

  // ✅ si viene "45 min" o "45min"
  if (typeof service?.duration === "string") {
    const m = service.duration.match(/(\d+)/);
    if (m) return parseInt(m[1], 10);
  }

  return 30;
}

export default function BookingSuccess({ booking, onNewBooking }) {
  const { branch, service, barber } = booking || {};

  useEffect(() => {
    const end = Date.now() + 3000;

    const colors = ["#f59e0b", "#ffffff", "#22c55e"];

    // 🎉 explosión inicial
    confetti({
      particleCount: 120,
      spread: 120,
      startVelocity: 45,
      origin: { y: 0.6 },
      colors,
    });

    const interval = setInterval(() => {
      const timeLeft = end - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 40 * (timeLeft / 3000);

      // izquierda
      confetti({
        particleCount,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });

      // derecha
      confetti({
        particleCount,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);
  // soporta camelCase y snake_case sin romper
  const clientName = booking?.client_name ?? booking?.clientName ?? "";
  const clientEmail = booking?.client_email ?? booking?.clientEmail ?? "";

  const googleCalendarLink = useMemo(() => {
    const dateStr = booking?.date;
    const timeStr = booking?.time;

    if (!dateStr || !timeStr) return null;

    const startDate = parseISO(`${dateStr}T${timeStr}:00`);
    if (!isValid(startDate)) return null;

    const durationMin = getDurationMinutes(service);
    const endDate = addMinutes(startDate, durationMin);

    if (!isValid(endDate)) return null;

    const formatGoogleDate = (d) => format(d, "yyyyMMdd'T'HHmmss");

    const title = encodeURIComponent(
      `Cita en ${branch?.name || ""} - ${service?.name || ""}`,
    );
    const details = encodeURIComponent(
      `Servicio: ${service?.name || ""}\n` +
        `Barbero: ${barber?.name || "Por asignar"}\n` +
        `Dirección: ${branch?.address || ""}`,
    );
    const location = encodeURIComponent(branch?.address || "");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGoogleDate(
      startDate,
    )}/${formatGoogleDate(endDate)}&details=${details}&location=${location}`;
  }, [booking?.date, booking?.time, service, branch, barber]);

  const emailPreview = `
Hola ${clientName || "cliente"},

¡Tu cita ha sido confirmada!

📍 Sucursal: ${branch?.name || "-"}
📌 Dirección: ${branch?.address || "-"}
✂️ Servicio: ${service?.name || "-"} (${getDurationMinutes(service)} min)
👤 Barbero: ${barber?.name || "Por asignar"}
📅 Fecha: ${
    booking?.date
      ? format(parseISO(booking.date), "EEEE, d 'de' MMMM 'de' yyyy", {
          locale: es,
        })
      : "-"
  }
🕐 Hora: ${booking?.time || "-"}

Total a pagar: ${service?.price || service?.priceAmount ? `$${service?.priceAmount ?? ""}` : "-"}

Te esperamos,
BarberShop Pro
  `.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
            className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-2">
            ¡Cita Confirmada!
          </h1>
          <p className="text-slate-400">
            Tu reserva ha sido registrada exitosamente
          </p>
        </div>

        {/* Booking Details */}
        <Card className="bg-white/5 border-white/10 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Detalles de tu cita
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-slate-300">
              <MapPin className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm text-slate-400">Sucursal</div>
                <div className="text-white">{branch?.name || "-"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <Scissors className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm text-slate-400">Servicio</div>
                <div className="text-white">{service?.name || "-"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <Calendar className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm text-slate-400">Fecha</div>
                <div className="text-white">
                  {booking?.date
                    ? format(parseISO(booking.date), "d 'de' MMMM, yyyy", {
                        locale: es,
                      })
                    : "-"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm text-slate-400">Hora</div>
                <div className="text-white">{booking?.time || "-"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <User className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm text-slate-400">Barbero</div>
                <div className="text-white">
                  {barber?.name || "Por asignar"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <Mail className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm text-slate-400">Email</div>
                <div className="text-white">{clientEmail || "-"}</div>
              </div>
            </div>
          </div>
        </Card>
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {googleCalendarLink ? (
            <Button
              asChild
              className="w-full h-12 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl">
              <a
                href={googleCalendarLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2">
                <CalendarPlus className="w-5 h-5 shrink-0" />
                <span>Agregar a Google Calendar</span>
              </a>
            </Button>
          ) : (
            <Button
              className="w-full sm:flex-1 min-h-[48px] bg-blue-600/40 text-white font-semibold rounded-xl
                 flex items-center justify-center gap-2 whitespace-normal text-center opacity-70 cursor-not-allowed"
              disabled>
              <CalendarPlus className="w-5 h-5 shrink-0" />
              <span className="leading-tight">
                Google Calendar (no disponible)
              </span>
            </Button>
          )}

          <Button
            onClick={onNewBooking}
            variant="outline"
            className="w-full sm:flex-1 min-h-[48px] border-white/20 text-white hover:bg-white/10 rounded-xl
               flex items-center justify-center gap-2">
            <span>Nueva Reserva</span>
            <ArrowRight className="w-5 h-5 shrink-0" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
