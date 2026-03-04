import React from "react";
import { Card, Text, Button, TextField, TextArea } from "@radix-ui/themes";
import {
  MapPin,
  Scissors,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  ChevronLeft,
  Check,
  Loader2,
  Shuffle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import MobileStepFooter from "../ui/MobileStepFooter";
import AppButton from "../ui/AppButton";
// ✅ Detecta si tu @radix-ui/themes soporta Root/Input
const hasRadixTextField =
  TextField &&
  typeof TextField === "object" &&
  typeof TextField.Root === "function" &&
  typeof TextField.Input === "function";

const InputWithIcon = ({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  Icon,
}) => {
  // ✅ Si Radix Themes soporta Root/Input, lo usamos
  if (hasRadixTextField) {
    return (
      <TextField.Root
        className="bg-white/5 border-white/20 text-white"
      >
        {/* NO usamos Slot (para evitar undefined según versión) */}
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>

        <TextField.Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="pl-10 text-white placeholder:text-slate-500"
        />
      </TextField.Root>
    );
  }

  // ✅ Fallback: input nativo (misma UI, no rompe)
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 px-3 py-2 rounded-md bg-white/5 border border-white/20 text-white placeholder:text-slate-500 outline-none"
      />
    </div>
  );
};

export default function StepConfirm({
  bookingData,
  barbers,
  onUpdate,
  onConfirm,
  onBack,
  isLoading,
}) {
  const {
    branch,
    service,
    date,
    time,
    barber,
    autoAssign,
    clientName,
    clientEmail,
    clientPhone,
    notes,
  } = bookingData;

  const selectedBarber = autoAssign ? null : barbers.find((b) => b.id === barber?.id);

  // ✅ Pedimos también teléfono para que sea consistente
  const isValid = !!clientName && !!clientEmail && !!clientPhone && (autoAssign || !!barber);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Confirma tu cita</h2>
        <p className="text-slate-400">Revisa los detalles y completa tus datos</p>
      </div>

      {/* Booking Summary */}
      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Resumen de tu cita</h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-slate-300">
            <MapPin className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-sm text-slate-400">Sucursal</div>
              <div className="text-white font-medium">{branch?.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <Scissors className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-sm text-slate-400">Servicio</div>
              <div className="text-white font-medium">
                {service?.name} - {service?.price} ({service?.duration})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <Calendar className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-sm text-slate-400">Fecha</div>
              <div className="text-white font-medium">
                {date ? format(parseISO(date), "EEEE, d 'de' MMMM", { locale: es }) : "-"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-sm text-slate-400">Hora</div>
              <div className="text-white font-medium">{time || "-"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            {autoAssign ? (
              <>
                <Shuffle className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-sm text-slate-400">Barbero</div>
                  <div className="text-white font-medium">Asignación automática</div>
                </div>
              </>
            ) : (
              <>
                <User className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-sm text-slate-400">Barbero</div>
                  <div className="text-white font-medium">
                    {selectedBarber?.name || barber?.name || "No seleccionado"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Client Data Form */}
      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Tus datos</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Text as="label" htmlFor="name" className="text-slate-300">
              Nombre completo *
            </Text>
            <InputWithIcon
              id="name"
              value={clientName}
              onChange={(e) => onUpdate({ clientName: e.target.value })}
              placeholder="Tu nombre"
              Icon={User}
            />
          </div>

          <div className="space-y-2">
            <Text as="label" htmlFor="email" className="text-slate-300">
              Email *
            </Text>
            <InputWithIcon
              id="email"
              type="email"
              value={clientEmail}
              onChange={(e) => onUpdate({ clientEmail: e.target.value })}
              placeholder="tu@email.com"
              Icon={Mail}
            />
          </div>

          <div className="space-y-2">
            <Text as="label" htmlFor="phone" className="text-slate-300">
              Teléfono *
            </Text>
            <InputWithIcon
              id="phone"
              type="tel"
              value={clientPhone}
              onChange={(e) => onUpdate({ clientPhone: e.target.value })}
              placeholder="+54 11 1234-5678"
              Icon={Phone}
            />
          </div>

          <div className="space-y-2">
            <Text as="label" htmlFor="notes" className="text-slate-300">
              Notas adicionales
            </Text>
            <TextArea
              id="notes"
              value={notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Algún comentario o preferencia..."
              className="bg-white/5 border-white/20 text-white placeholder:text-slate-500 resize-none"
              rows={3}
            />
          </div>
        </div>
      </Card>
        <MobileStepFooter>
        <div className="w-full sm:w-auto">
          <AppButton
            variant="outline"
            fullWidth
            leftIcon={ChevronLeft}
            onClick={onBack}
          >
            Atrás
          </AppButton>
        </div>

        <div className="w-full sm:w-auto">
          <AppButton
            variant="primary"
            fullWidth
            rightIcon={Check}
            onClick={onConfirm}
            disabled={!isValid || isLoading}
          >
            Confirmar Cita
          </AppButton>
        </div>
      </MobileStepFooter>
    </div>
  );
}