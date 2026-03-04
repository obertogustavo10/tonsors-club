// src/services/storage.service.js
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";

/**
 * Sube un archivo (File) a Storage y devuelve { path, url }
 * folder ejemplo: "cars", "users", "orders"
 */
export async function uploadImage({ file, folder, fileNamePrefix = "" }) {
  if (!file) throw new Error("No file provided");

  const safeName = file.name.replace(/\s+/g, "_");
  const finalName = `${fileNamePrefix}${Date.now()}_${safeName}`;
  const path = `${folder}/${finalName}`;

  const storageRef = ref(storage, path);

  // metadata opcional
  const metadata = { contentType: file.type || "image/jpeg" };

  await uploadBytes(storageRef, file, metadata);
  const url = await getDownloadURL(storageRef);

  return { path, url };
}