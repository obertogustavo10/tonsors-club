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
    horarios: data?.horarios ?? null,
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