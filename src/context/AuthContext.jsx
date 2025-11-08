// DOSYA: src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "../firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Sadece başlangıçta true

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Kullanıcı giriş yaptı, profilini çek
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          setUserProfile(null);
          console.warn(
            "Kullanıcı girişi var ama Firestore'da profil bulunamadı:",
            user.uid
          );
        }
      } else {
        // Kullanıcı çıkış yaptı
        setUserProfile(null);
      }

      // 1. DÜZELTME: setLoading(true) buradan kaldırıldı.
      // İster kullanıcı bulunsun, ister bulunmasın,
      // ilk auth kontrolü bittiğinde yüklemeyi durdur.
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
  };

  // Yükleme bitmeden alt bileşenleri (uygulamayı) render etme
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
