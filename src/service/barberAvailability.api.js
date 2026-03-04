// src/services/barberSlots.api.js
import { db } from "../firebase/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

export const DEFAULT_TIME_SLOTS = [
  "10:00","10:45","11:30","12:15","13:00","13:45","14:30",
  "15:15","16:00","16:45","17:30","18:15","19:00",
];

const COLLECTION = "barbero_slots";
const makeId = (barberId, date) => `${barberId}_${date}`;

const uniq = (arr) => [...new Set((arr || []).filter(Boolean))];

export async function getBarberDaySlots({ barberId, date }) {
  const ref = doc(db, COLLECTION, makeId(barberId, date));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Crea el doc del día si no existe (blockedSlots/bookedSlots vacíos).
 */
export async function ensureBarberDaySlots({ barberId, branchId, date }) {
  const ref = doc(db, COLLECTION, makeId(barberId, date));
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() };

  const payload = {
    barber_id: barberId,
    branch_id: branchId,
    date,
    blockedSlots: [],
    bookedSlots: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });
  return { id: ref.id, ...payload };
}

/**
 * Barbero bloquea horarios manualmente (agrega a blockedSlots).
 */
export async function blockSlotsManual({ barberId, branchId, date, times = [] }) {
  const ref = doc(db, COLLECTION, makeId(barberId, date));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    const base = snap.exists() ? snap.data() : {
      barber_id: barberId,
      branch_id: branchId,
      date,
      blockedSlots: [],
      bookedSlots: [],
      createdAt: serverTimestamp(),
    };

    const blockedSlots = uniq([...(base.blockedSlots || []), ...times]);

    tx.set(ref, {
      ...base,
      barber_id: barberId,
      branch_id: branchId,
      date,
      blockedSlots,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  return true;
}

/**
 * Barbero desbloquea horarios manualmente (quita de blockedSlots).
 */
export async function unblockSlotsManual({ barberId, branchId, date, times = [] }) {
  const ref = doc(db, COLLECTION, makeId(barberId, date));
  const toRemove = new Set(times);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      // si no existe, no hay nada que desbloquear
      return;
    }

    const data = snap.data();
    const blockedSlots = (data.blockedSlots || []).filter(t => !toRemove.has(t));

    tx.update(ref, { blockedSlots, updatedAt: serverTimestamp() });
  });

  return true;
}

/**
 * Reserva (bloquea para usuario) un horario de forma atómica:
 * - si está bloqueado o ya reservado => error
 * - si está libre => agrega a bookedSlots
 */
export async function reserveSlotAtomic({ barberId, branchId, date, time }) {
  if (!time) throw new Error("time requerido");
  const ref = doc(db, COLLECTION, makeId(barberId, date));

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    const base = snap.exists() ? snap.data() : {
      barber_id: barberId,
      branch_id: branchId,
      date,
      blockedSlots: [],
      bookedSlots: [],
      createdAt: serverTimestamp(),
    };

    const blocked = base.blockedSlots || [];
    const booked = base.bookedSlots || [];

    if (blocked.includes(time)) {
      throw new Error("Horario bloqueado por el barbero");
    }
    if (booked.includes(time)) {
      throw new Error("Horario ya reservado");
    }

    const bookedSlots = uniq([...booked, time]);

    tx.set(ref, {
      ...base,
      barber_id: barberId,
      branch_id: branchId,
      date,
      bookedSlots,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { ok: true, bookedSlots };
  });
}

/**
 * Helper: calcula disponibles para UI con el timeSlots base del front.
 */
export function computeAvailableSlots({ blockedSlots = [], bookedSlots = [] }) {
  const blocked = new Set(blockedSlots || []);
  const booked = new Set(bookedSlots || []);
  return DEFAULT_TIME_SLOTS.filter(t => !blocked.has(t) && !booked.has(t));
}