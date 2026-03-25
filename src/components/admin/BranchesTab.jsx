import React, { useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Phone, Clock } from "lucide-react";
import {
  createSucursal,
  deleteSucursal,
  updateSucursal,
} from "../../service/sucursales.api";

const initialForm = {
  name: "",
  address: "",
  phone: "",
  horarios: {
    open: "09:00",
    close: "20:00",
  },
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

export default function BranchesTab({ branches, onRefresh }) {
  const [formDialog, setFormDialog] = useState({ open: false, branch: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, branch: null });
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const openCreateDialog = () => {
    setForm(initialForm);
    setFormDialog({ open: true, branch: null });
  };

  const openEditDialog = (branch) => {
    setForm({
      name: branch.name || "",
      address: branch.address || "",
      phone: branch.phone || "",
      horarios: {
        open: branch.horarios?.open || "09:00",
        close: branch.horarios?.close || "20:00",
      },
    });
    setFormDialog({ open: true, branch });
  };

  const closeDialogs = () => {
    setFormDialog({ open: false, branch: null });
    setDeleteDialog({ open: false, branch: null });
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      if (formDialog.branch) {
        await updateSucursal({ id: formDialog.branch.id, data: form });
      } else {
        await createSucursal({ data: form });
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
      await deleteSucursal(deleteDialog.branch.id);
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
                    <span>
                      {branch.horarios?.open || "09:00"} -{" "}
                      {branch.horarios?.close || "20:00"}
                    </span>
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
              <label className="mb-2 block text-sm text-slate-300">Direccion</label>
              <input
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Apertura</label>
                <input
                  type="time"
                  value={form.horarios.open}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      horarios: { ...prev.horarios, open: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Cierre</label>
                <input
                  type="time"
                  value={form.horarios.close}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      horarios: { ...prev.horarios, close: event.target.value },
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
