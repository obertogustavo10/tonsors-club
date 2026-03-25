import {
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  listItems,
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

export async function createBarbero({ data, imageFile = null }) {
  const branch_id = (data?.branch_id || "").trim();
  const name = (data?.name || "").trim();
  const phone = (data?.phone || "").trim();
  const email = (data?.email || "").trim();

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

  const id = nanoid();
  const payload = {
    id,
    branch_id,
    name,
    phone,
    email,
    specialty: (data?.specialty || "").trim(),
    rating: toNumberOrNull(data?.rating) ?? 0,
    reviews: toNumberOrNull(data?.reviews) ?? 0,
    imageUrl: image?.url || null,
    imagePath: image?.path || null,
    isActive: data?.isActive ?? true,
  };

  return createItem(COLLECTION, payload);
}

export async function updateBarbero({ id, data, newImageFile = null }) {
  if (!id) throw new Error("Barbero: id is required");

  const patch = { ...data };

  if (typeof data?.branch_id === "string") patch.branch_id = data.branch_id.trim();
  if (typeof data?.name === "string") patch.name = data.name.trim();
  if (typeof data?.phone === "string") patch.phone = data.phone.trim();
  if (typeof data?.email === "string") patch.email = data.email.trim();
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
