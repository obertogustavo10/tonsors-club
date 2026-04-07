import React, { useMemo, useState } from "react";
import { format, endOfWeek, startOfWeek } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Clock,
  Copy,
} from "lucide-react";
import {
  createSucursal,
  deleteSucursal,
  normalizeBranchHorarios,
  updateSucursal,
} from "../../service/sucursales.api";

const DAY_OPTIONS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miercoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sabado" },
  { key: "sunday", label: "Domingo" },
];

const DEFAULT_FORM = {
  name: "",
  address: "",
  phone: "",
  horarios: normalizeBranchHorarios(),
};

function createInitialForm() {
  return {
    ...DEFAULT_FORM,
    horarios: normalizeBranchHorarios(),
  };
}

function buildFormFromBranch(branch) {
  return {
    name: branch?.name || "",
    address: branch?.address || "",
    phone: branch?.phone || "",
    horarios: normalizeBranchHorarios(branch?.horarios),
  };
}

function formatBranchScheduleSummary(horarios) {
  const normalized = normalizeBranchHorarios(horarios);
  const labels = DAY_OPTIONS.map(({ key, label }) => {
    const day = normalized.weekly[key];
    return day?.isOpen ? `${label}: ${day.open} - ${day.close}` : `${label}: Cerrado`;
  });

  return labels.slice(0, 2).concat(labels.length > 2 ? "..." : []);
}

function validateWeeklySchedule(horarios) {
  const invalidDay = DAY_OPTIONS.find(({ key }) => {
    const day = horarios?.weekly?.[key];
    if (!day?.isOpen) return false;
    if (!day.open || !day.close) return true;
    return day.open >= day.close;
  });

  if (!invalidDay) return "";

  const day = horarios.weekly[invalidDay.key];
  if (!day.open || !day.close) {
    return `Completa apertura y cierre para ${invalidDay.label}.`;
  }

  return `La apertura de ${invalidDay.label} debe ser menor al cierre.`;
}

function AdminModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function BranchesTab({ branches, onRefresh }) {
  const [formDialog, setFormDialog] = useState({ open: false, branch: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, branch: null });
  const [form, setForm] = useState(createInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  const openCreateDialog = () => {
    setForm(createInitialForm());
    setScheduleError("");
    setFormDialog({ open: true, branch: null });
  };

  const openEditDialog = (branch) => {
    setForm(buildFormFromBranch(branch));
    setScheduleError("");
    setFormDialog({ open: true, branch });
  };

  const closeDialogs = () => {
    setFormDialog({ open: false, branch: null });
    setDeleteDialog({ open: false, branch: null });
    setForm(createInitialForm());
    setScheduleError("");
  };

  const updateDaySchedule = (dayKey, patch) => {
    setForm((prev) => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        weekly: {
          ...prev.horarios.weekly,
          [dayKey]: {
            ...prev.horarios.weekly[dayKey],
            ...patch,
          },
        },
      },
    }));
    setScheduleError("");
  };

  const applyDayToKeys = (sourceKey, targetKeys) => {
    setForm((prev) => {
      const source = prev.horarios.weekly[sourceKey];
      const nextWeekly = { ...prev.horarios.weekly };

      targetKeys.forEach((key) => {
        nextWeekly[key] = { ...source };
      });

      return {
        ...prev,
        horarios: {
          ...prev.horarios,
          weekly: nextWeekly,
        },
      };
    });
    setScheduleError("");
  };

  const applyToWorkweek = (sourceKey) => {
    applyDayToKeys(sourceKey, ["monday", "tuesday", "wednesday", "thursday", "friday"]);
  };

  const applyToWholeWeek = (sourceKey) => {
    applyDayToKeys(
      sourceKey,
      DAY_OPTIONS.map((day) => day.key)
    );
  };

  const normalizedFormHorarios = useMemo(
    () => normalizeBranchHorarios(form.horarios),
    [form.horarios]
  );
  const currentWeekLabel = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    return `${format(weekStart, "dd/MM/yyyy")} - ${format(weekEnd, "dd/MM/yyyy")}`;
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedHorarios = normalizeBranchHorarios(form.horarios);
    const validationMessage = validateWeeklySchedule(normalizedHorarios);

    if (validationMessage) {
      setScheduleError(validationMessage);
      return;
    }

    const payload = {
      ...form,
      horarios: normalizedHorarios,
    };

    try {
      setSubmitting(true);
      if (formDialog.branch) {
        await updateSucursal({
          id: formDialog.branch.firestoreId || formDialog.branch.id,
          data: payload,
        });
      } else {
        await createSucursal({ data: payload });
      }
      closeDialogs();
      await onRefresh();
    } catch (error) {
      console.error("Error guardando sucursal:", error);
      window.alert("No se pudo guardar la sucursal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.branch) return;

    try {
      setSubmitting(true);
      await deleteSucursal(
        deleteDialog.branch.firestoreId || deleteDialog.branch.id
      );
      closeDialogs();
      await onRefresh();
    } catch (error) {
      console.error("Error eliminando sucursal:", error);
      window.alert("No se pudo eliminar la sucursal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sucursales</h2>
          <p className="text-slate-400">Gestiona las ubicaciones activas</p>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-3 font-semibold text-black hover:bg-amber-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva sucursal
        </button>
      </div>

      {branches.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
          <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay sucursales registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              {branch.coverImageUrl && (
                <div className="h-32 overflow-hidden">
                  <img
                    src={branch.coverImageUrl}
                    alt={branch.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white">{branch.name}</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-amber-400" />
                    <span>{branch.address || "Sin direccion"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Phone className="w-4 h-4 mt-0.5 text-amber-400" />
                    <span>{branch.phone || "Sin telefono"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Clock className="w-4 h-4 mt-0.5 text-amber-400" />
                    <div className="space-y-1">
                      {formatBranchScheduleSummary(branch.horarios).map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => openEditDialog(branch)}
                    className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="w-4 h-4 inline-block mr-2" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteDialog({ open: true, branch })}
                    className="rounded-xl bg-red-500/10 px-4 py-3 text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formDialog.open && (
        <AdminModal
          title={formDialog.branch ? "Editar sucursal" : "Nueva sucursal"}
          onClose={closeDialogs}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Nombre</label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Telefono</label>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Direccion</label>
              <input
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-white">
                    Horario semanal
                  </h4>
                  <p className="text-sm text-slate-400">
                    Se cargan valores por defecto y luego puedes ajustarlos o
                    copiar el horario a otros dias.
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-300">
                    Semana actual: {currentWeekLabel}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  Base actual: {normalizedFormHorarios.open} -{" "}
                  {normalizedFormHorarios.close}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {DAY_OPTIONS.map(({ key, label }) => {
                  const day = normalizedFormHorarios.weekly[key];

                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="flex min-w-32 items-center justify-between gap-3 lg:block">
                          <div className="text-sm font-semibold text-white">
                            {label}
                          </div>
                          <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={day.isOpen}
                              onChange={(event) =>
                                updateDaySchedule(key, {
                                  isOpen: event.target.checked,
                                })
                              }
                              className="h-4 w-4 rounded border-white/10 bg-slate-900"
                            />
                            Abierto
                          </label>
                        </div>

                        <div className="grid flex-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-xs text-slate-400">
                              Apertura
                            </label>
                            <input
                              type="time"
                              value={day.open}
                              disabled={!day.isOpen}
                              onChange={(event) =>
                                updateDaySchedule(key, {
                                  open: event.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs text-slate-400">
                              Cierre
                            </label>
                            <input
                              type="time"
                              value={day.close}
                              disabled={!day.isOpen}
                              onChange={(event) =>
                                updateDaySchedule(key, {
                                  close: event.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => applyToWorkweek(key)}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copiar a lun-vie
                          </button>
                          <button
                            type="button"
                            onClick={() => applyToWholeWeek(key)}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copiar a toda la semana
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {scheduleError && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {scheduleError}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeDialogs}
                className="rounded-xl border border-white/10 px-4 py-3 text-slate-300 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !form.name}
                className="rounded-xl bg-amber-500 px-4 py-3 font-semibold text-black hover:bg-amber-600 disabled:opacity-60"
              >
                Guardar
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {deleteDialog.open && (
        <AdminModal title="Eliminar sucursal" onClose={closeDialogs}>
          <p className="text-slate-300">
            Vas a eliminar{" "}
            <span className="font-semibold text-white">
              {deleteDialog.branch?.name}
            </span>
            .
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeDialogs}
              className="rounded-xl border border-white/10 px-4 py-3 text-slate-300 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Eliminar
            </button>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
