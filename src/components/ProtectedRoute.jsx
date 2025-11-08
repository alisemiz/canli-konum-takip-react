// YENİ DOSYA: src/components/ProtectedRoute.jsx

import React from "react";
import { useAuth } from "../context/AuthContext.jsx"; // Auth context'imizi kullan
import { Navigate, useLocation } from "react-router-dom";

// Bu bileşen, içine aldığı 'children' (sayfaları) koruma altına alır
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Eğer kullanıcı giriş yapmamışsa, onu /login sayfasına yönlendir.
    // 'replace' ve 'state', giriş yaptıktan sonra geldiği sayfaya geri dönebilmesi için
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Eğer kullanıcı giriş yapmışsa, istediği sayfayı (children) göster
  return children;
}

export default ProtectedRoute;
