// src/services/firestore.service.js
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/**
 * Convención: cada doc tendrá createdAt/updatedAt automáticos.
 */

export async function createItem(collectionName, data) {
  const colRef = collection(db, collectionName);
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const res = await addDoc(colRef, payload);
  return { id: res.id, ...data };
}

export async function updateItem(collectionName, id, data) {
  const docRef = doc(db, collectionName, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(docRef, payload);
  return { id, ...data };
}

export async function deleteItem(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
  return true;
}

export async function getItemById(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function listItems(collectionName) {
  const colRef = collection(db, collectionName);
  const snap = await getDocs(colRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Query helper ejemplo:
 * listByField("orders", "userId", "abc123")
 */
export async function listByField(collectionName, field, value, opts = {}) {
  const colRef = collection(db, collectionName);

  const constraints = [where(field, "==", value)];
  if (opts.orderByField) constraints.push(orderBy(opts.orderByField, opts.orderDir || "desc"));
  if (opts.limit) constraints.push(limit(opts.limit));

  const q = query(colRef, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}