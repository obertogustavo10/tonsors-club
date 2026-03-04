// src/services/turnos.service.js
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function createTurno(turnoData) {
  const payload = {
    ...turnoData,
    status: turnoData.status ?? "confirmed",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "turnos"), payload);
  return { id: ref.id, ...turnoData };
}