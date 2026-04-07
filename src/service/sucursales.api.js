// src/services/sucursales.api.js
import {
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  listItems,
} from "./firestore.service";
import { uploadImage } from "./storage.service";

const COLLECTION = "sucursales";
const DEFAULT_WEEKLY_SCHEDULE = {
  monday: { isOpen: true, open: "09:00", close: "20:00" },
  tuesday: { isOpen: true, open: "09:00", close: "20:00" },
  wednesday: { isOpen: true, open: "09:00", close: "20:00" },
  thursday: { isOpen: true, open: "09:00", close: "20:00" },
  friday: { isOpen: true, open: "09:00", close: "20:00" },
  saturday: { isOpen: true, open: "09:00", close: "18:00" },
  sunday: { isOpen: false, open: "09:00", close: "18:00" },
};

function sanitizeDaySchedule(day, fallback) {
  return {
    isOpen: day?.isOpen ?? fallback.isOpen,
    open: day?.open || fallback.open,
    close: day?.close || fallback.close,
  };
}

export function normalizeBranchHorarios(horarios) {
  const hasWeeklySchedule = Boolean(horarios?.weekly);
  const fallbackOpen = horarios?.open || DEFAULT_WEEKLY_SCHEDULE.monday.open;
  const fallbackClose = horarios?.close || DEFAULT_WEEKLY_SCHEDULE.monday.close;

  const weekly = Object.entries(DEFAULT_WEEKLY_SCHEDULE).reduce(
    (accumulator, [dayKey, defaultDay]) => {
      const baseFallback =
        dayKey === "saturday" || dayKey === "sunday"
          ? defaultDay
          : {
              ...defaultDay,
              open: fallbackOpen,
              close: fallbackClose,
            };

      accumulator[dayKey] = sanitizeDaySchedule(
        horarios?.weekly?.[dayKey],
        baseFallback
      );
      return accumulator;
    },
    {}
  );

  const openDays = Object.values(weekly).filter((day) => day.isOpen);
  const firstOpenDay = openDays[0] || DEFAULT_WEEKLY_SCHEDULE.monday;
  const normalizedOpen = hasWeeklySchedule
    ? openDays.reduce(
        (earliest, day) => (day.open < earliest ? day.open : earliest),
        firstOpenDay.open
      )
    : horarios?.open || firstOpenDay.open;
  const normalizedClose = hasWeeklySchedule
    ? openDays.reduce(
        (latest, day) => (day.close > latest ? day.close : latest),
        firstOpenDay.close
      )
    : horarios?.close || firstOpenDay.close;

  return {
    open: normalizedOpen,
    close: normalizedClose,
    weekly,
  };
}

/**
 * data sugerido:
 * {
 *   name: string,
 *   address?: string,
 *   phone?: string,
 *   isActive?: boolean,
 *   horarios?: { open: string, close: string },
 *   location?: { lat: number, lng: number },
 * }
 *
 * coverFile: File opcional (imagen de portada)
 */
export async function createSucursal({ data, coverFile }) {
  const name = (data?.name || "").trim();
  if (!name) throw new Error("Sucursal: name is required");
  const horarios = normalizeBranchHorarios(data?.horarios);

  let cover = null;
  if (coverFile) {
    cover = await uploadImage({
      file: coverFile,
      folder: "sucursales",
      fileNamePrefix: "sucursal_",
    });
  }

  return createItem(COLLECTION, {
    ...data,
    name,
    address: (data?.address || "").trim(),
    phone: (data?.phone || "").trim(),
    isActive: data?.isActive ?? true,
    location: data?.location ?? null,
    horarios,
    coverImageUrl: cover?.url || null,
    coverImagePath: cover?.path || null,
  });
}

export async function updateSucursal({ id, data, newCoverFile }) {
  if (!id) throw new Error("Sucursal: id is required");

  let patch = {
    ...data,
  };

  if (typeof data?.name === "string") patch.name = data.name.trim();
  if (typeof data?.address === "string") patch.address = data.address.trim();
  if (typeof data?.phone === "string") patch.phone = data.phone.trim();
  if (data?.horarios) patch.horarios = normalizeBranchHorarios(data.horarios);

  if (newCoverFile) {
    const cover = await uploadImage({
      file: newCoverFile,
      folder: "sucursales",
      fileNamePrefix: "sucursal_",
    });
    patch.coverImageUrl = cover.url;
    patch.coverImagePath = cover.path;
  }

  return updateItem(COLLECTION, id, patch);
}

export async function deleteSucursal(id) {
  return deleteItem(COLLECTION, id);
}

export async function getSucursal(id) {
  return getItemById(COLLECTION, id);
}

export async function listSucursales() {
  return listItems(COLLECTION);
}
