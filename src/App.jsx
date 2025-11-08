// DOSYA: src/App.jsx

import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Sayfalarımızı import edelim
import AnaSayfa from "./pages/AnaSayfa.jsx";
import KuryeSayfasi from "./pages/KuryeSayfasi.jsx";
import MusteriSayfasi from "./pages/MusteriSayfasi.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import YeniSiparisSayfasi from "./pages/YeniSiparisSayfasi.jsx";
import KuryePaneli from "./pages/KuryePaneli.jsx";
// 1. YENİ SAYFAYI import et
import SiparislerimSayfasi from "./pages/SiparislerimSayfasi.jsx";

// Koruma bileşenimizi import edelim
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Herkesin görebileceği rotalar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Korumalı Rotalar */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AnaSayfa />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kurye/:gorevId"
          element={
            <ProtectedRoute>
              <KuryeSayfasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/musteri/:gorevId"
          element={
            <ProtectedRoute>
              <MusteriSayfasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/yeni-siparis"
          element={
            <ProtectedRoute>
              <YeniSiparisSayfasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kurye-paneli"
          element={
            <ProtectedRoute>
              <KuryePaneli />
            </ProtectedRoute>
          }
        />

        {/* 2. YENİ MÜŞTERİ ROTASINI EKLE (Bu da korumalı olmalı) */}
        <Route
          path="/siparislerim"
          element={
            <ProtectedRoute>
              <SiparislerimSayfasi />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
