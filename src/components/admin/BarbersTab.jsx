import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  User,
  Star,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import {
  createBarbero,
  deleteBarbero,
  updateBarbero,
} from "../../service/barberos.api";

const initialForm = {
  name: "",
  branch_id: "",
  specialty: "",
  phone: "",
  email: "",
  rating: 5,
  reviews: 0,
};

function AdminModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
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

export default function BarbersTab({ barbers, branches, onRefresh }) {
  const [formDialog, setFormDialog] = useState({ open: false, barber: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, barber: null });
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openCreateDialog = () => {
    setForm(initialForm);
    setImageFile(null);
    setImagePreview("");
    setFormDialog({ open: true, barber: null });
  };

  const openEditDialog = (barber) => {
    setForm({
      name: barber.name || "",
      branch_id: barber.branch_id || "",
      specialty: barber.specialty || "",
      phone: barber.phone || "",
      email: barber.email || "",
      rating: barber.rating ?? 5,
      reviews: barber.reviews ?? 0,
    });
    setImageFile(null);
    setImagePreview(barber.imageUrl || "");
    setFormDialog({ open: true, barber });
  };

  const closeDialogs = () => {
    setFormDialog({ open: false, barber: null });
    setDeleteDialog({ open: false, barber: null });
    setForm(initialForm);
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : formDialog.barber?.imageUrl || "");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      if (formDialog.barber) {
        await updateBarbero({
          id: formDialog.barber.id,
          data: form,
          newImageFile: imageFile,
        });
      } else {
        await createBarbero({ data: form, imageFile });
      }
      closeDialogs();
      await onRefresh();
    } catch (error) {
      console.error("Error guardando barbero:", error);
      window.alert("No se pudo guardar el barbero.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.barber) return;

    try {
      setSubmitting(true);
      await deleteBarbero(deleteDialog.barber.id);
      closeDialogs();
      await onRefresh();
    } catch (error) {
      console.error("Error eliminando barbero:", error);
      window.alert("No se pudo eliminar el barbero.");
    } finally {
      setSubmitting(false);
    }
  };

  const getBranch = (branchId) =>
    branches.find((branch) => branch.id === branchId)?.name || "Sin sucursal";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Barberos</h2>
          <p className="text-slate-400">
            Gestiona equipo, contacto y foto publica desde Firebase
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-3 font-semibold text-black hover:bg-amber-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo barbero
        </button>
      </div>

      {barbers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay barberos registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/10 mx-auto">
                  {barber.imageUrl ? (
                    <img
                      src={barber.imageUrl}
                      alt={barber.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-amber-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white">{barber.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {barber.specialty || "Sin especialidad"}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-300">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  {getBranch(barber.branch_id)}
                </div>
                {barber.phone && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-300">
                    <Phone className="w-4 h-4 text-amber-400" />
                    {barber.phone}
                  </div>
                )}
                {barber.email && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-300">
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span className="truncate">{barber.email}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-white">{barber.rating ?? 0}</span>
                  <span className="text-slate-500">({barber.reviews ?? 0})</span>
                </div>
                <div className="mt-5 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditDialog(barber)}
                    className="rounded-lg bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteDialog({ open: true, barber })}
                    className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"
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
          title={formDialog.barber ? "Editar barbero" : "Nuevo barbero"}
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
                <label className="mb-2 block text-sm text-slate-300">Sucursal</label>
                <select
                  value={form.branch_id}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, branch_id: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                >
                  <option value="">Seleccionar sucursal</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Telefono</label>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="+54 11 1234-5678"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Correo</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="barbero@tonsors.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Especialidad
              </label>
              <input
                value={form.specialty}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, specialty: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Foto del barbero
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:font-semibold file:text-black"
              />
              {imagePreview && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <p className="text-sm text-slate-300">
                    Esta imagen se sube a Firebase Storage y se guarda su URL publica.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Rating</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, rating: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Reviews</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.reviews}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, reviews: event.target.value }))
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
                disabled={submitting || !form.name || !form.branch_id}
                className="rounded-xl bg-amber-500 px-4 py-3 font-semibold text-black hover:bg-amber-600 disabled:opacity-60"
              >
                Guardar
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {deleteDialog.open && (
        <AdminModal title="Eliminar barbero" onClose={closeDialogs}>
          <p className="text-slate-300">
            Vas a eliminar a{" "}
            <span className="font-semibold text-white">
              {deleteDialog.barber?.name}
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
