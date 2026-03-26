import React, { useState } from "react";
import {
  Pencil,
  Trash2,
  User,
  Star,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  deleteBarbero,
  updateBarbero,
} from "../../service/barberos.api";
import { updateUserAccess } from "../../service/auth.service";

const initialForm = {
  name: "",
  branch_id: "",
  specialty: "",
  phone: "",
  email: "",
  available: true,
  rating: 5,
  reviews: 0,
};

function AdminModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:px-4 sm:py-6">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-900 shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Cerrar
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">{children}</div>
      </div>
    </div>
  );
}

export default function BarbersTab({
  barbers,
  branches,
  onRefresh,
  canManage = false,
  userProfilesMap = {},
}) {
  const [formDialog, setFormDialog] = useState({ open: false, barber: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, barber: null });
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingAccessUid, setUpdatingAccessUid] = useState(null);

  const openEditDialog = (barber) => {
    setForm({
      name: barber.name || "",
      branch_id: barber.branch_id || "",
      specialty: barber.specialty || "",
      phone: barber.phone || "",
      email: barber.email || "",
      available: barber.available ?? true,
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
    setImagePreview(
      file ? URL.createObjectURL(file) : formDialog.barber?.imageUrl || ""
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      await updateBarbero({
        id: formDialog.barber.firestoreId || formDialog.barber.id,
        data: form,
        newImageFile: imageFile,
      });
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
      await deleteBarbero(deleteDialog.barber.firestoreId || deleteDialog.barber.id);
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

  const getLinkedUser = (barber) =>
    userProfilesMap[barber.authUid || barber.userUid] || null;

  const toggleAccess = async (barber) => {
    const linkedUid = barber.authUid || barber.userUid;
    if (!linkedUid) {
      window.alert("Este barbero todavia no tiene un usuario vinculado.");
      return;
    }

    const linkedUser = getLinkedUser(barber);
    const nextApproved = !(linkedUser?.approved === true || linkedUser?.enabled === true);

    try {
      setUpdatingAccessUid(linkedUid);
      await updateUserAccess(linkedUid, {
        approved: nextApproved,
        enabled: nextApproved,
      });
      await onRefresh();
    } catch (error) {
      console.error("Error actualizando acceso del usuario:", error);
      window.alert("No se pudo actualizar el alta del usuario.");
    } finally {
      setUpdatingAccessUid(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {canManage ? "Barberos" : "Mi perfil"}
          </h2>
          <p className="text-slate-400">
            {canManage
              ? "Gestiona equipo, contacto y foto publica desde Firebase"
              : "Actualiza tu informacion profesional"}
          </p>
        </div>
        {canManage && (
          <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-300">
            Los barberos se crean desde el registro de cuenta.
          </div>
        )}
      </div>

      {barbers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay barberos registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {barbers.map((barber) => {
            const linkedUser = getLinkedUser(barber);
            const isApproved =
              linkedUser?.approved === true || linkedUser?.enabled === true;

            return (
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
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-300">
                    <ShieldCheck
                      className={`w-4 h-4 ${
                        barber.available === false ? "text-red-400" : "text-emerald-400"
                      }`}
                    />
                    {barber.available === false ? "No disponible" : "Disponible"}
                  </div>
                  {canManage && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-300">
                      <UserCheck
                        className={`w-4 h-4 ${
                          isApproved ? "text-emerald-400" : "text-amber-400"
                        }`}
                      />
                      {linkedUser
                        ? isApproved
                          ? "Acceso habilitado"
                          : "Pendiente de alta"
                        : "Sin usuario vinculado"}
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
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => toggleAccess(barber)}
                        disabled={updatingAccessUid === (barber.authUid || barber.userUid)}
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${
                          isApproved
                            ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                            : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                        } disabled:opacity-60`}
                      >
                        {updatingAccessUid === (barber.authUid || barber.userUid)
                          ? "Guardando..."
                          : isApproved
                            ? "Deshabilitar alta"
                            : "Dar alta"}
                      </button>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => setDeleteDialog({ open: true, barber })}
                        className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formDialog.open && (
        <AdminModal
          title="Editar barbero"
          onClose={closeDialogs}
        >
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
                {canManage ? (
                  <>
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
                    {branches.length === 0 && (
                      <p className="mt-2 text-xs text-amber-300">
                        No hay sucursales cargadas todavia.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      value={getBranch(form.branch_id)}
                      readOnly
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300 outline-none"
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      La sucursal la asigna un administrador.
                    </p>
                  </>
                )}
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

            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white">Disponible</p>
                <p className="text-xs text-slate-400">
                  Controla si el barbero puede ser asignado a nuevos turnos
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, available: !prev.available }))
                }
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  form.available
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                {form.available ? "Si" : "No"}
              </button>
            </div>

            {canManage && (
              <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Alta de acceso</p>
                  <p className="text-xs text-slate-400">
                    Permite o bloquea la entrada al panel para este usuario
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAccess(formDialog.barber)}
                  disabled={
                    !formDialog.barber?.authUid &&
                    !formDialog.barber?.userUid
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    (
                      getLinkedUser(formDialog.barber || {})?.approved === true ||
                      getLinkedUser(formDialog.barber || {})?.enabled === true
                    )
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  } disabled:opacity-60`}
                >
                  {(
                    getLinkedUser(formDialog.barber || {})?.approved === true ||
                    getLinkedUser(formDialog.barber || {})?.enabled === true
                  )
                    ? "Habilitado"
                    : "Pendiente"}
                </button>
              </div>
            )}

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

            {canManage && (
              <div className="grid gap-4 sm:grid-cols-2">
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
            )}

            <div className="sticky bottom-0 flex flex-col gap-3 border-t border-white/10 bg-slate-900 pt-4 sm:flex-row sm:justify-end">
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

      {canManage && deleteDialog.open && (
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
