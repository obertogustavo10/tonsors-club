import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import {
  createBarbero,
  findBarberoByAuthUid,
  findBarberoByEmail,
  updateBarbero,
} from "./barberos.api";

export const USERS_COLLECTION = "users";
const LEGACY_USERS_COLLECTION = "admin_users";

export function isUserApproved(profile) {
  return profile?.approved === true || profile?.enabled === true;
}

export function isAdminRole(profile) {
  return profile?.rol === "admin";
}

export function isBarberRole(profile) {
  return profile?.rol === "barbero";
}

async function getProfileFromCollection(collectionName, uid) {
  const snapshot = await getDoc(doc(db, collectionName, uid));
  if (!snapshot.exists()) return null;

  return {
    uid: snapshot.id,
    ...snapshot.data(),
  };
}

async function migrateLegacyProfileIfNeeded(uid) {
  const legacyProfile = await getProfileFromCollection(LEGACY_USERS_COLLECTION, uid);
  if (!legacyProfile) return null;

  const migratedProfile = {
    uid,
    nombre: legacyProfile.nombre || "",
    apellido: legacyProfile.apellido || "",
    email: (legacyProfile.email || "").trim().toLowerCase(),
    telefono: legacyProfile.telefono || "",
    approved: legacyProfile.approved ?? false,
    enabled: legacyProfile.enabled ?? false,
    rol:
      legacyProfile.rol === "admin" || legacyProfile.rol === "barbero"
        ? legacyProfile.rol
        : "barbero",
    barberFirestoreId: legacyProfile.barberFirestoreId || null,
    createdAt: legacyProfile.createdAt ?? serverTimestamp(),
  };

  await setDoc(doc(db, USERS_COLLECTION, uid), migratedProfile, { merge: true });
  return migratedProfile;
}

export async function getUserProfile(uid) {
  if (!uid) return null;

  const profile = await getProfileFromCollection(USERS_COLLECTION, uid);
  if (profile) return profile;

  return migrateLegacyProfileIfNeeded(uid);
}

export async function getUserProfilesByIds(uids = []) {
  const uniqueUids = [...new Set((uids || []).filter(Boolean))];
  const profiles = await Promise.all(uniqueUids.map((uid) => getUserProfile(uid)));

  return profiles.reduce((acc, profile) => {
    if (profile?.uid) acc[profile.uid] = profile;
    return acc;
  }, {});
}

export async function updateUserAccess(uid, data = {}) {
  if (!uid) throw new Error("uid is required");

  await setDoc(
    doc(db, USERS_COLLECTION, uid),
    {
      ...data,
    },
    { merge: true }
  );

  return getUserProfile(uid);
}

async function ensureBarberProfileForUser({
  uid,
  firstName,
  lastName,
  email,
  phone,
  barberFirestoreId = null,
}) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();

  let barberProfile = null;

  if (barberFirestoreId) {
    barberProfile = await findBarberoByAuthUid(uid);
  }

  if (!barberProfile) {
    barberProfile = await findBarberoByAuthUid(uid);
  }

  if (!barberProfile && normalizedEmail) {
    barberProfile = await findBarberoByEmail(normalizedEmail);
  }

  if (barberProfile) {
    await updateBarbero({
      id: barberProfile.firestoreId || barberProfile.id,
      data: {
        authUid: uid,
        userUid: uid,
        name: barberProfile.name || fullName,
        email: normalizedEmail || barberProfile.email || "",
        phone: phone || barberProfile.phone || "",
        available: barberProfile.available ?? true,
      },
    });

    return barberProfile.firestoreId || barberProfile.id;
  }

  const createdBarber = await createBarbero({
    data: {
      authUid: uid,
      userUid: uid,
      branch_id: "",
      name: fullName || normalizedEmail || "Barbero",
      specialty: "",
      phone,
      email: normalizedEmail,
      rating: 0,
      reviews: 0,
      available: true,
      isActive: true,
    },
  });

  return createdBarber.firestoreId || createdBarber.id;
}

export async function registerPanelUser({
  firstName,
  lastName,
  email,
  phone,
  password,
}) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    await updateProfile(credential.user, { displayName: fullName });
  }

  const barberFirestoreId = await ensureBarberProfileForUser({
    uid: credential.user.uid,
    firstName,
    lastName,
    email,
    phone,
  });

  await setDoc(doc(db, USERS_COLLECTION, credential.user.uid), {
    uid: credential.user.uid,
    nombre: firstName.trim(),
    apellido: lastName.trim(),
    email: email.trim().toLowerCase(),
    telefono: phone.trim(),
    approved: false,
    enabled: false,
    rol: "barbero",
    barberFirestoreId,
    createdAt: serverTimestamp(),
  });

  return credential.user;
}

export async function loginPanelUser({ email, password }) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  const profile = await getUserProfile(credential.user.uid);
  if (profile && profile.rol === "barbero" && !profile.barberFirestoreId) {
    const barberFirestoreId = await ensureBarberProfileForUser({
      uid: credential.user.uid,
      firstName: profile.nombre,
      lastName: profile.apellido,
      email: profile.email || credential.user.email,
      phone: profile.telefono,
    });

    await updateDoc(doc(db, USERS_COLLECTION, credential.user.uid), {
      barberFirestoreId,
    });
  }

  return credential.user;
}

export async function logoutPanelUser() {
  await signOut(auth);
}
