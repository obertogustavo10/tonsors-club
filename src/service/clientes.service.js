import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

export function normalizeClientEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

export function getClientDocIdByEmail(email) {
  const normalizedEmail = normalizeClientEmail(email);
  if (!normalizedEmail) return "";

  // Avoid invalid Firestore document ids while keeping a deterministic key.
  return encodeURIComponent(normalizedEmail);
}

export async function upsertClientFromTurno(turnoData = {}) {
  const normalizedEmail = normalizeClientEmail(turnoData.client_email);
  if (!normalizedEmail) return null;

  const clientDocId = getClientDocIdByEmail(normalizedEmail);
  if (!clientDocId) return null;

  const clientRef = doc(db, "clientes", clientDocId);
  const payload = {
    name: turnoData.client_name?.trim?.() || "",
    phone: turnoData.client_phone?.trim?.() || "",
    email: normalizedEmail,
    email_normalized: normalizedEmail,
    last_booking_at: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(clientRef, payload, { merge: true });

  return {
    id: clientDocId,
    ...payload,
  };
}
