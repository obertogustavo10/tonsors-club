import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { upsertClientFromTurno } from "./clientes.service";
import {
  getConsecutiveSlots,
  SLOT_INTERVAL_MINUTES,
} from "./barberAvailability.api";
import { getServiceDurationMinutes } from "./servicios.api";

const BARBER_SLOTS_COLLECTION = "barbero_slots";

function getTurnoOccupiedSlots(turno) {
  if (Array.isArray(turno?.occupied_slots) && turno.occupied_slots.length > 0) {
    return turno.occupied_slots;
  }

  const durationMinutes =
    turno?.duration_minutes ||
    getServiceDurationMinutes(turno?.service) ||
    SLOT_INTERVAL_MINUTES;

  return getConsecutiveSlots({
    startTime: turno?.time,
    durationMinutes,
  });
}

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

export async function cancelTurno(turno) {
  const turnoId = turno?.firestoreId || turno?.id;

  if (!turnoId) {
    throw new Error("Turno invalido");
  }

  const barberId = turno?.barber_id || turno?.barber?.id;
  const branchId = turno?.branch_id || turno?.branch?.id || null;
  const date = turno?.date;
  const occupiedSlots = getTurnoOccupiedSlots(turno);

  await runTransaction(db, async (tx) => {
    const turnoRef = doc(db, "turnos", turnoId);
    const turnoSnap = await tx.get(turnoRef);

    if (!turnoSnap.exists()) {
      throw new Error("El turno no existe");
    }

    let daySlotsRef = null;
    let daySlotsSnap = null;

    if (barberId && date && occupiedSlots.length > 0) {
      daySlotsRef = doc(db, BARBER_SLOTS_COLLECTION, `${barberId}_${date}`);
      daySlotsSnap = await tx.get(daySlotsRef);
    }

    tx.update(turnoRef, {
      status: "cancelled",
      updatedAt: serverTimestamp(),
    });

    if (!daySlotsRef || !daySlotsSnap?.exists()) {
      return;
    }

    const daySlots = daySlotsSnap.data();
    const occupiedSlotSet = new Set(occupiedSlots);
    const bookedSlots = (daySlots.bookedSlots || []).filter(
      (slot) => !occupiedSlotSet.has(slot)
    );

    tx.set(
      daySlotsRef,
      {
        ...daySlots,
        barber_id: barberId,
        branch_id: branchId,
        date,
        bookedSlots,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}
