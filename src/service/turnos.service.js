import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { upsertClientFromTurno } from "./clientes.service";

function normalizeTurno(docItem) {
  const data = docItem.data();
  return {
    ...data,
    firestoreId: docItem.id,
    id: data?.id ?? docItem.id,
  };
}

export async function createTurno(turnoData) {
  const payload = {
    ...turnoData,
    status: turnoData.status ?? "confirmed",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "turnos"), payload);

  try {
    await upsertClientFromTurno(turnoData);
  } catch (error) {
    console.error("Error guardando cliente del turno:", error);
  }

  return {
    ...turnoData,
    firestoreId: ref.id,
    id: turnoData?.id ?? ref.id,
  };
}

export async function listTurnos() {
  const snapshot = await getDocs(collection(db, "turnos"));
  return snapshot.docs.map(normalizeTurno);
}

export async function listTurnosByBarbero(barberId) {
  if (!barberId) return [];

  const snapshot = await getDocs(
    query(collection(db, "turnos"), where("barber_id", "==", barberId))
  );
  const queriedTurnos = snapshot.docs.map(normalizeTurno);

  if (queriedTurnos.length > 0) return queriedTurnos;

  const allTurnos = await listTurnos();
  return allTurnos.filter(
    (turno) => turno.barber_id === barberId || turno.barber?.id === barberId
  );
}

export async function updateTurno(id, data) {
  const docRef = doc(db, "turnos", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
