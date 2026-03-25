// src/services/turnos.service.js
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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

export async function listTurnos() {
  const snapshot = await getDocs(collection(db, "turnos"));
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
}

export async function updateTurno(id, data) {
  const docRef = doc(db, "turnos", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
