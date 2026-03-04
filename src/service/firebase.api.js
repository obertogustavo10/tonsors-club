// src/services/firebase.api.js
import {
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  listItems,
  listByField,
} from "./firestore.service";
import { uploadImage } from "./storage.service";

/**
 * EJEMPLO: colección "cars"
 * - crea auto con imagen (sube imagen -> guarda url en doc)
 */
export async function createCar({ data, imageFile }) {
  let image = null;

  if (imageFile) {
    const uploaded = await uploadImage({
      file: imageFile,
      folder: "cars",
      fileNamePrefix: "car_",
    });
    image = uploaded; // {path, url}
  }

  return createItem("cars", {
    ...data,
    imageUrl: image?.url || null,
    imagePath: image?.path || null,
  });
}

export async function updateCar({ id, data, newImageFile }) {
  let patch = { ...data };

  if (newImageFile) {
    const uploaded = await uploadImage({
      file: newImageFile,
      folder: "cars",
      fileNamePrefix: "car_",
    });

    patch.imageUrl = uploaded.url;
    patch.imagePath = uploaded.path;
  }

  return updateItem("cars", id, patch);
}

export async function deleteCar(id) {
  // Nota: aquí solo borra Firestore.
  // Si querés borrar el archivo en Storage también, se agrega deleteObject().
  return deleteItem("cars", id);
}

export async function getCar(id) {
  return getItemById("cars", id);
}

export async function listCars() {
  return listItems("cars");
}

export async function listCarsByOwner(ownerId) {
  return listByField("cars", "ownerId", ownerId, { orderByField: "createdAt", orderDir: "desc" });
}