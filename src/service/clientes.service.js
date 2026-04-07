import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

function normalizeCliente(docItem) {
  const data = docItem.data();
  return {
    ...data,
    firestoreId: docItem.id,
    id: data?.id ?? docItem.id,
  };
}

export function normalizeClientEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

export function getClientDocIdByEmail(email) {
  const normalizedEmail = normalizeClientEmail(email);
  if (!normalizedEmail) return "";
  return encodeURIComponent(normalizedEmail);
}

export async function listClientes() {
  const snapshot = await getDocs(
    query(collection(db, "clientes"), orderBy("name", "asc"))
  );
  return snapshot.docs.map(normalizeCliente);
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
