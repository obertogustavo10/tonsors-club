import {
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  listItems,
  listByField,
} from "./firestore.service";
import { uploadImage } from "./storage.service";
import { nanoid } from "nanoid";

const COLLECTION = "barberos";

function toNumberOrNull(value) {
  if (value == null || value === "") return null;
  const parsed =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBarbero(barbero) {
  if (!barbero) return null;

  return {
    ...barbero,
    email: (barbero.email || "").trim().toLowerCase(),
    available: barbero.available ?? true,
  };
}

export async function createBarbero({ data, imageFile = null }) {
  const branch_id = (data?.branch_id || "").trim();
  const name = (data?.name || "").trim();
  const phone = (data?.phone || "").trim();
  const email = (data?.email || "").trim().toLowerCase();

  if (!name) throw new Error("Barbero: name is required");

  let image = null;
  if (imageFile) {
    image = await uploadImage({
      file: imageFile,
      folder: "barberos",
      fileNamePrefix: "barbero_",
    });
  }

  const id = nanoid();
  const payload = {
    id,
    branch_id,
    authUid: (data?.authUid || "").trim() || null,
    userUid: (data?.userUid || "").trim() || null,
    name,
    phone,
    email,
    specialty: (data?.specialty || "").trim(),
    rating: toNumberOrNull(data?.rating) ?? 0,
    reviews: toNumberOrNull(data?.reviews) ?? 0,
    available: data?.available ?? true,
    imageUrl: image?.url || null,
    imagePath: image?.path || null,
    isActive: data?.isActive ?? true,
  };

  const created = await createItem(COLLECTION, payload);
  return normalizeBarbero(created);
}

export async function updateBarbero({ id, data, newImageFile = null }) {
  if (!id) throw new Error("Barbero: id is required");

  const patch = { ...data };

  if (typeof data?.branch_id === "string") patch.branch_id = data.branch_id.trim();
  if (typeof data?.authUid === "string") patch.authUid = data.authUid.trim() || null;
  if (typeof data?.userUid === "string") patch.userUid = data.userUid.trim() || null;
  if (typeof data?.name === "string") patch.name = data.name.trim();
  if (typeof data?.phone === "string") patch.phone = data.phone.trim();
  if (typeof data?.email === "string") patch.email = data.email.trim().toLowerCase();
  if (typeof data?.specialty === "string") patch.specialty = data.specialty.trim();
  if (typeof data?.available === "boolean") patch.available = data.available;

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

  const updated = await updateItem(COLLECTION, id, patch);
  return normalizeBarbero(updated);
}

export async function deleteBarbero(id) {
  return deleteItem(COLLECTION, id);
}

export async function getBarbero(id) {
  const barber = await getItemById(COLLECTION, id);
  return normalizeBarbero(barber);
}

export async function getBarberoByFirestoreId(id) {
  if (!id) return null;
  const barber = await getItemById(COLLECTION, id);
  return normalizeBarbero(barber);
}

export async function listBarberos() {
  const barberos = await listItems(COLLECTION);
  return barberos.map(normalizeBarbero);
}

export async function findBarberoByAuthUid(authUid) {
  if (!authUid) return null;
  const [barber] = await listByField(COLLECTION, "authUid", authUid);
  return normalizeBarbero(barber || null);
}

export async function findBarberoByEmail(email) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;
  const [barber] = await listByField(COLLECTION, "email", normalizedEmail);
  return normalizeBarbero(barber || null);
}
