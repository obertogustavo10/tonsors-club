import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import {
  USERS_COLLECTION,
  getUserProfile,
  isAdminRole,
  isBarberRole,
  isUserApproved,
  loginPanelUser,
  logoutPanelUser,
  registerPanelUser,
} from "../service/auth.service";
import {
  findBarberoByAuthUid,
  getBarberoByFirestoreId,
} from "../service/barberos.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [barberProfile, setBarberProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setBarberProfile(null);
        setLoading(false);
        return;
      }

      try {
        setUser(firebaseUser);
        unsubscribeProfile = onSnapshot(
          doc(db, USERS_COLLECTION, firebaseUser.uid),
          async (snapshot) => {
            const nextProfile = snapshot.exists()
              ? { uid: snapshot.id, ...snapshot.data() }
              : await getUserProfile(firebaseUser.uid);

            setProfile(nextProfile);

            if (nextProfile?.rol === "barbero") {
              const nextBarber =
                (nextProfile?.barberFirestoreId &&
                  (await getBarberoByFirestoreId(nextProfile.barberFirestoreId))) ||
                (await findBarberoByAuthUid(firebaseUser.uid));
              setBarberProfile(nextBarber);
            } else {
              setBarberProfile(null);
            }

            setLoading(false);
          },
          (error) => {
            console.error("Error escuchando perfil de usuario:", error);
            setProfile(null);
            setBarberProfile(null);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Error cargando perfil:", error);
        setUser(firebaseUser);
        setProfile(null);
        setBarberProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setProfile(null);
      setBarberProfile(null);
      return null;
    }

    const nextProfile = await getUserProfile(auth.currentUser.uid);
    setProfile(nextProfile);

    if (nextProfile?.rol === "barbero") {
      const nextBarber =
        (nextProfile?.barberFirestoreId &&
          (await getBarberoByFirestoreId(nextProfile.barberFirestoreId))) ||
        (await findBarberoByAuthUid(auth.currentUser.uid));
      setBarberProfile(nextBarber);
    } else {
      setBarberProfile(null);
    }

    return nextProfile;
  };

  const register = async (payload) => {
    await registerPanelUser(payload);
    return refreshProfile();
  };

  const login = async (payload) => {
    await loginPanelUser(payload);
    return refreshProfile();
  };

  const logout = async () => {
    await logoutPanelUser();
    setUser(null);
    setProfile(null);
    setBarberProfile(null);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      barberProfile,
      loading,
      approved: isUserApproved(profile),
      isAdmin: isAdminRole(profile),
      isBarber: isBarberRole(profile),
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, profile, barberProfile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
