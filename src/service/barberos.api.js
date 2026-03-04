// src/services/barberos.api.js
import {
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  listItems,
} from "./firestore.service";
import { uploadImage } from "./storage.service";
import { nanoid } from 'nanoid';


const COLLECTION = "barberos";

/**
 * Estructura esperada:
 * {
 *  id: "u1" (Firestore lo genera, pero vos podés mantener este campo como barberCode si querés),
 *  branch_id: "b1",
 *  name: "Leo",
 *  specialty: "Fade / Degradados",
 *  rating: 4.9,
 *  reviews: 210,
 *  imageUrl?: string | null,
 *  imagePath?: string | null
 * }
 */

/** Normaliza números tipo "4.9" -> 4.9, "210" -> 210 */
function toNumberOrNull(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function createBarbero({ data, imageFile = null }) {
  const branch_id = (data?.branch_id || "").trim();
  const name = (data?.name || "").trim();

  if (!branch_id) throw new Error("Barbero: branch_id is required");
  if (!name) throw new Error("Barbero: name is required");

  let image = null;
  if (imageFile) {
    image = await uploadImage({
      file: imageFile,
      folder: "barberos",
      fileNamePrefix: "barbero_",
    });
  }
const id = nanoid(); // opcional: si querés generar tu propio id legible, sino lo deja Firestore con auto-id
  const payload = {
    id,
    branch_id,
    name,
    specialty: (data?.specialty || "").trim(),
    rating: toNumberOrNull(data?.rating) ?? 0,   // podés dejar null si preferís
    reviews: toNumberOrNull(data?.reviews) ?? 0, // podés dejar null si preferís

    imageUrl: image?.url || null,
    imagePath: image?.path || null,

    isActive: data?.isActive ?? true, // opcional útil
  };

  return createItem(COLLECTION, payload);
}

export async function updateBarbero({ id, data, newImageFile = null }) {
  if (!id) throw new Error("Barbero: id is required");

  const patch = { ...data };

  if (typeof data?.branch_id === "string") patch.branch_id = data.branch_id.trim();
  if (typeof data?.name === "string") patch.name = data.name.trim();
  if (typeof data?.specialty === "string") patch.specialty = data.specialty.trim();

  if (data?.rating != null) patch.rating = toNumberOrNull(data.rating);
  if (data?.reviews != null) patch.reviews = toNumberOrNull(data.reviews);

  if (newImageFile) {
    const image = await uploadImage({
      file: newImageFile,
      folder: "barberos",
      fileNamePrefix: "barbero_",
    });
    patch.imageUrl = image.url;
    patch.imagePath = image.path;
  }

  return updateItem(COLLECTION, id, patch);
}

export async function deleteBarbero(id) {
  return deleteItem(COLLECTION, id);
}

export async function getBarbero(id) {
  return getItemById(COLLECTION, id);
}

export async function listBarberos() {
  return listItems(COLLECTION);
}

/**
 * (Opcional) si querés filtrar por sucursal sin traer todo:
 * Esto requiere que tu firestore.service.js tenga listByField o query helper.
 * Si lo tenés, decime y te lo dejo conectado.
 */
// export async function listBarberosByBranch(branchId) {
//   return listByField(COLLECTION, "branch_id", branchId, { orderByField: "name", orderDir: "asc" });
// }