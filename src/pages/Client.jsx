import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Scissors, MapPin, Calendar, User, CheckCircle } from "lucide-react";
import { createTurno } from "../service/turnos.service";
import { listSucursales } from "../service/sucursales.api";
import { listBarberos } from "../service/barberos.api";
import StepBranch from "../components/booking/StepBranch";
import StepService from "../components/booking/StepService";
import StepDateTime from "../components/booking/StepDateTime";
import StepBarber from "../components/booking/StepBarber";
import StepConfirm from "../components/booking/StepConfirm";
import BookingSuccess from "../components/booking/BookingSuccess";
import { listServicios } from "../service/servicios.api";
import FullPageLoader from "../components/ui/FullPageLoader";
import { mockBookings } from "../mock/bookingMockData";
import { reserveSlotAtomic } from "../service/barberAvailability.api";
import logoTonsors from "../assets/logo-tonsors-dorado.png";
import { Link } from "react-router-dom";
import {
  getInitialBooking,
  setBooking,
  clearBooking,
} from "../lib/sessionStore";

const STEPS = [
  { id: 1, title: "Sucursal", icon: MapPin },
  { id: 2, title: "Servicio", icon: Scissors },
  { id: 3, title: "Barbero", icon: User },
  { id: 4, title: "Fecha/Hora", icon: Calendar },
  { id: 5, title: "Confirmar", icon: CheckCircle },
];

export default function Client() {
  const [currentStep, setCurrentStep] = useState(1);
  // ✅ bookingData persistido (sessionStorage)
  const [bookingData, setBookingData] = useState(getInitialBooking());
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [barberos, setBarberos] = useState([]);
  // ✅ booking final (para BookingSuccess)
  const [completedBooking, setCompletedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [sucursales, servicios, barberos] = await Promise.all([
          listSucursales(),
          listServicios(),
          listBarberos(),
        ]);

        setBranches(sucursales);
        setServices(servicios);
        setBarberos(barberos);

        console.log("Sucursales:", sucursales);
        console.log("Servicios:", servicios);
        console.log("Barberos:", barberos);
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  useEffect(() => {
    setBooking(bookingData);
  }, [bookingData]);
  const updateBookingData = (updates) => {
    setBookingData((prev) => ({ ...prev, ...updates }));
  };
  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));
  const resetBooking = () => {
    clearBooking();
    setCurrentStep(1);
    setBookingData(getInitialBooking());
    setCompletedBooking(null);
  };
  // ✅ barbers filtrados por branch (StepBarber + StepDateTime + StepConfirm)
  const barbers = useMemo(() => {
    const branchId = bookingData.branch?.id;
    if (!branchId) return [];
    return barberos?.filter(
      (b) => b.branch_id === branchId && b.isActive !== false && b.available !== false
    );
  }, [barberos, bookingData.branch?.id]);
  const bookings = mockBookings;
  const onConfirmBooking = async () => {
    setLoading(true);
    try {
      const created = {
        id: `bk_${Date.now()}`,

        branch: bookingData.branch,
        branch_id: bookingData.branch?.id ?? null,
        service: bookingData.service,
        service_id: bookingData.service?.id ?? null,
        barber: bookingData.autoAssign ? null : bookingData.barber,
        barber_id: bookingData.autoAssign ? null : bookingData.barber?.id ?? null,
        barbero_email: bookingData.autoAssign
          ? null
          : bookingData.barber?.email ?? null,
        autoAssign: bookingData.autoAssign,

        date: bookingData.date,
        time: bookingData.time,

        client_name: bookingData.clientName,
        client_email: bookingData.clientEmail,
        client_phone: bookingData.clientPhone,
        notes: bookingData.notes,

        status: "confirmed",
        createdAt: new Date().toISOString(),
        source: "web",
      };
      console.log("Turno a crear:", {
        barberId: bookingData.barber.id,
        branchId: bookingData.branch.id,
        date: bookingData.date,
        time: bookingData.time,
      });
      const hola = await reserveSlotAtomic({
        barberId: bookingData.barber.id,
        branchId: bookingData.branch.id,
        date: bookingData.date,
        time: bookingData.time,
      });
      console.log("Reserva de slot result:", hola);
      // ✅ 1) Guardar en Firestore (colección: turnos)
      const saved = await createTurno(created);
      setCompletedBooking(bookingData);
    } catch (err) {
      console.error("❌ Error creando turno en Firebase:", err);
      // acá podés mostrar toast/alert si querés
    } finally {
      setLoading(false);
    }
  };
  if (completedBooking) {
    return (
      <BookingSuccess booking={completedBooking} onNewBooking={resetBooking} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <FullPageLoader show={loading} label="Cargando información" />
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 md:gap-3 md:justify-start justify-between">
            <Link
              to="/"
              className="flex h-16 w-28 items-center justify-start overflow-visible rounded-xl md:h-20 md:w-20"
            >
              <img
                src={logoTonsors}
                alt="Tonsors Club Logo"
                className="h-24 w-32 scale-[1.35] object-contain object-left md:h-20 md:w-20 md:scale-100"
              />
            </Link>
            <Link to="/">
              <h1 className="text-lg md:text-2xl font-bold text-white">
                Tonsor's{" "}
                <span className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                  Club
                </span>
              </h1>
              <p className="text-slate-400 text-xs md:text-sm">
                Trasformamos tu estilo
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Progress + Steps */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-12">
          {/* 5 columnas siempre, centrado */}
          <div className="grid grid-cols-5 justify-items-center items-center gap-2 sm:gap-6">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className="w-full flex flex-col items-center">
                  {/* Row: circle + divider (side) */}
                  <div className="w-full flex items-center justify-center">
                    {/* Circle */}
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.08 : 1,
                      }}
                      className={`relative flex items-center justify-center rounded-full transition-all duration-300
                  w-10 h-10 sm:w-12 sm:h-12
                  ${
                    isCompleted || isActive
                      ? "bg-amber-500 shadow-lg shadow-amber-500/30"
                      : "bg-white/10"
                  }
                `}>
                      <Icon
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          isCompleted || isActive
                            ? "text-black"
                            : "text-slate-400"
                        }`}
                      />

                      {/* Divider at side (except last) */}
                      {index < STEPS.length - 1 && (
                        <span
                          className={`absolute top-1/2 -translate-y-1/2
      left-full ml-2 sm:ml-4
      h-0.5
      w-4 sm:w-6 md:w-14 lg:w-20  
      ${currentStep > step.id ? "bg-amber-500" : "bg-white/10"}`}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Label */}
                  <span
                    className={`mt-2 text-[10px] sm:text-xs font-medium text-center
                ${isCompleted || isActive ? "text-amber-400" : "text-slate-500"}
              `}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenido por Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}>
            {currentStep === 1 && (
              <StepBranch
                branches={branches}
                selected={bookingData.branch}
                onSelect={(branch) => updateBookingData({ branch })}
                onNext={nextStep}
              />
            )}

            {currentStep === 2 && (
              <StepService
                services={services}
                selected={bookingData.service}
                onSelect={(service) => updateBookingData({ service })}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 3 && (
              <StepBarber
                barbers={barbers}
                selected={bookingData.barber}
                autoAssign={bookingData.autoAssign}
                onSelect={(barber) =>
                  updateBookingData({ barber, autoAssign: false })
                }
                onAutoAssign={() =>
                  updateBookingData({ autoAssign: true, barber: null })
                }
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 4 && (
              <StepDateTime
                branch={bookingData.branch}
                service={bookingData.service}
                bookings={bookings}
                barbers={bookingData.barber}
                selectedDate={bookingData.date}
                selectedTime={bookingData.time}
                onSelect={(date, time) => updateBookingData({ date, time })}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}

            {currentStep === 5 && (
              <StepConfirm
                bookingData={bookingData}
                barbers={barbers}
                onUpdate={updateBookingData}
                onConfirm={onConfirmBooking}
                onBack={prevStep}
                isLoading={false}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
