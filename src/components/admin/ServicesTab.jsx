import React, { useState } from "react";
import { Plus, Pencil, Trash2, Scissors, Clock, DollarSign } from "lucide-react";
import {
  createServicio,
  deleteServicio,
  updateServicio,
} from "../../service/servicios.api";

const initialForm = {
  title: "",
  description: "",
  durationMinutes: 30,
  priceAmount: 0,
};

function AdminModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
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

export default function ServicesTab({ services, onRefresh }) {
  const [formDialog, setFormDialog] = useState({ open: false, service: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, service: null });
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const openCreateDialog = () => {
    setForm(initialForm);
    setFormDialog({ open: true, service: null });
  };

  const openEditDialog = (service) => {
    setForm({
      title: service.name || service.title || "",
      description: service.description || "",
      durationMinutes: service.durationMinutes || service.duration || 30,
      priceAmount:
        service.priceAmount ||
        Number(String(service.price || "0").replace(/\D/g, "")) ||
        0,
    });
    setFormDialog({ open: true, service });
  };

  const closeDialogs = () => {
    setFormDialog({ open: false, service: null });
    setDeleteDialog({ open: false, service: null });
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      if (formDialog.service) {
        await updateServicio({
          id: formDialog.service.firestoreId || formDialog.service.id,
          data: form,
        });
      } else {
        await createServicio({ data: form });
      }
      closeDialogs();
      await onRefresh();
    } catch (error) {
      console.error("Error guardando servicio:", error);
      window.alert("No se pudo guardar el servicio.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.service) return;

    try {
      setSubmitting(true);
      await deleteServicio(
        deleteDialog.service.firestoreId || deleteDialog.service.id
      );
      closeDialogs();
      await onRefresh();
    } catch (error) {
      console.error("Error eliminando servicio:", error);
      window.alert("No se pudo eliminar el servicio.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Servicios</h2>
          <p className="text-slate-400">Gestiona catalogo, duracion y precio</p>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-3 font-semibold text-black hover:bg-amber-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo servicio
        </button>
      </div>

      {services.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
          <Scissors className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay servicios registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
                <Scissors className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-center text-lg font-semibold text-white">
                {service.name || service.title}
              </h3>
              <p className="mt-2 min-h-10 text-center text-sm text-slate-400">
                {service.description || "Sin descripcion"}
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{service.durationMinutes || service.duration || 0} min</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-amber-300">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {service.price || service.priceLabel || service.priceAmount || 0}
                  </span>
                </div>
              </div>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditDialog(service)}
                  className="rounded-lg bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteDialog({ open: true, service })}
                  className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formDialog.open && (
        <AdminModal
          title={formDialog.service ? "Editar servicio" : "Nuevo servicio"}
          onClose={closeDialogs}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Nombre</label>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Descripcion</label>
              <textarea
                rows="3"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Duracion</label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={form.durationMinutes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      durationMinutes: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Precio</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.priceAmount}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      priceAmount: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </div>
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
                disabled={submitting || !form.title}
                className="rounded-xl bg-amber-500 px-4 py-3 font-semibold text-black hover:bg-amber-600 disabled:opacity-60"
              >
                Guardar
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {deleteDialog.open && (
        <AdminModal title="Eliminar servicio" onClose={closeDialogs}>
          <p className="text-slate-300">
            Vas a eliminar{" "}
            <span className="font-semibold text-white">
              {deleteDialog.service?.name}
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
