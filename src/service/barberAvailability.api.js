import { db } from "../firebase/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

export const DEFAULT_TIME_SLOTS = [
  "10:00",
  "10:45",
  "11:30",
  "12:15",
  "13:00",
  "13:45",
  "14:30",
  "15:15",
  "16:00",
  "16:45",
  "17:30",
  "18:15",
  "19:00",
];

export const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires";

const COLLECTION = "barbero_slots";
const makeId = (barberId, date) => `${barberId}_${date}`;

const uniq = (arr) => [...new Set((arr || []).filter(Boolean))];

function getArgentinaDateParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(now).reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function getArgentinaTodayDateString(now = new Date()) {
  const { year, month, day } = getArgentinaDateParts(now);
  return `${year}-${month}-${day}`;
}

function normalizeDaySlots(docRefOrSnapId, data = {}) {
  return {
    id: docRefOrSnapId,
    ...data,
    blockedSlots: data?.blockedSlots || [],
    bookedSlots: data?.bookedSlots || [],
  };
}

export async function getBarberDaySlots({ barberId, date }) {
  if (!barberId || !date) return null;

  const ref = doc(db, COLLECTION, makeId(barberId, date));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normalizeDaySlots(snap.id, snap.data());
}

export async function ensureBarberDaySlots({ barberId, branchId, date }) {
  const ref = doc(db, COLLECTION, makeId(barberId, date));
  const snap = await getDoc(ref);
  if (snap.exists()) return normalizeDaySlots(snap.id, snap.data());

  const payload = {
    barber_id: barberId,
    branch_id: branchId || null,
    date,
    blockedSlots: [],
    bookedSlots: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });
  return normalizeDaySlots(ref.id, payload);
}

export async function blockSlotsManual({ barberId, branchId, date, times = [] }) {
  const ref = doc(db, COLLECTION, makeId(barberId, date));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    const base = snap.exists()
      ? snap.data()
      : {
          barber_id: barberId,
          branch_id: branchId || null,
          date,
          blockedSlots: [],
          bookedSlots: [],
          createdAt: serverTimestamp(),
        };

    const blockedSlots = uniq([...(base.blockedSlots || []), ...times]);

    tx.set(
      ref,
      {
        ...base,
        barber_id: barberId,
        branch_id: branchId || null,
        date,
        blockedSlots,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  return getBarberDaySlots({ barberId, date });
}

export async function unblockSlotsManual({ barberId, branchId, date, times = [] }) {
  const ref = doc(db, COLLECTION, makeId(barberId, date));
  const toRemove = new Set(times);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const blockedSlots = (data.blockedSlots || []).filter(
      (time) => !toRemove.has(time)
    );

    tx.set(
      ref,
      {
        ...data,
        barber_id: barberId,
        branch_id: branchId || null,
        date,
        blockedSlots,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  return getBarberDaySlots({ barberId, date });
}

export async function setManualBlockedSlots({
  barberId,
  branchId,
  date,
  times = [],
}) {
  const ref = doc(db, COLLECTION, makeId(barberId, date));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const base = snap.exists()
      ? snap.data()
      : {
          barber_id: barberId,
          branch_id: branchId || null,
          date,
          bookedSlots: [],
          createdAt: serverTimestamp(),
        };

    tx.set(
      ref,
      {
        ...base,
        barber_id: barberId,
        branch_id: branchId || null,
        date,
        blockedSlots: uniq(times),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  return getBarberDaySlots({ barberId, date });
}

export async function reserveSlotAtomic({ barberId, branchId, date, time }) {
  if (!time) throw new Error("time requerido");
  const ref = doc(db, COLLECTION, makeId(barberId, date));

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    const base = snap.exists()
      ? snap.data()
      : {
          barber_id: barberId,
          branch_id: branchId || null,
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

    tx.set(
      ref,
      {
        ...base,
        barber_id: barberId,
        branch_id: branchId || null,
        date,
        bookedSlots,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { ok: true, bookedSlots };
  });
}

export function computeAvailableSlots({ blockedSlots = [], bookedSlots = [] }) {
  const blocked = new Set(blockedSlots || []);
  const booked = new Set(bookedSlots || []);
  return DEFAULT_TIME_SLOTS.filter(
    (time) => !blocked.has(time) && !booked.has(time)
  );
}

export function isPastTimeSlot({ date, time, now = new Date() }) {
  if (!date || !time) return false;

  const todayString = getArgentinaTodayDateString(now);
  if (date !== todayString) return false;

  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;

  const argentinaNow = getArgentinaDateParts(now);
  const slotMinutes = hours * 60 + minutes;
  const nowMinutes = argentinaNow.hour * 60 + argentinaNow.minute;

  return slotMinutes <= nowMinutes;
}

export function filterFutureSlots({ date, slots = [], now = new Date() }) {
  return (slots || []).filter(
    (time) => !isPastTimeSlot({ date, time, now })
  );
}
