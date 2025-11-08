// DOSYA: src/pages/KuryeSayfasi.jsx

import React, { useState, useRef, useEffect } from "react";
import { db } from "../firebaseConfig.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "react-hot-toast";

// 1. YENİ SOHBET BİLEŞENİNİ IMPORT ET
import SiparisChat from "../components/SiparisChat.jsx";

// Harita importları ve ikonlar
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { divIcon } from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;
const homeIcon = divIcon({
  html: `<span style="font-size: 2.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏠</span>`,
  className: "bg-transparent border-none",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Harita Takip ve Gri Ekran Düzeltme Yardımcısı
function FollowCourierView({ position, isTracking }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    if (isTracking && position) {
      map.flyTo(position, 16, { animate: true, duration: 1.0 });
    }
    return () => clearTimeout(timer);
  }, [position, isTracking, map]);
  return null;
}

function KuryeSayfasi() {
  const { gorevId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [authError, setAuthError] = useState(null);

  const intervalIdRef = useRef(null);

  // Görev yetkilendirme
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!currentUser || !gorevId) return;
      const docRef = doc(db, "deliveries", gorevId);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTaskDetails(data);
          if (data.courierId !== currentUser.uid) {
            toast.error("ERİŞİM REDDEDİLDİ: Bu görev size ait değil.");
            setAuthError("ERİŞİM REDDEDİLDİ: Bu görev size ait değil.");
          }
        } else {
          toast.error("HATA: Bu görev ID'si bulunamadı.");
          setAuthError("HATA: Bu görev ID'si bulunamadı.");
        }
      } catch (err) {
        toast.error("Veritabanı hatası: " + err.message);
        setAuthError("Veritabanı hatası: " + err.message);
      }
    };
    checkAuthorization();
  }, [gorevId, currentUser]);

  // Fonksiyon 1: Konum Simülasyonu
  const startGeolocationListener = () => {
    setIsTracking(true);
    toast.success("Simülasyon Modu Başlatıldı!", { id: "geo-toast" });
    setTaskDetails((prev) => ({ ...prev, status: "in_progress" }));

    const initialFakeLocation = {
      lat: taskDetails?.destination?.lat || 39.9255,
      lng: taskDetails?.destination?.lng || 32.8663,
      timestamp: new Date(),
    };

    setLocation(initialFakeLocation);
    updateLocationInFirestore(initialFakeLocation);

    intervalIdRef.current = setInterval(() => {
      setLocation((prevLoc) => {
        if (!prevLoc) return initialFakeLocation;

        const newSimulatedLocation = {
          lat: prevLoc.lat + 0.0001,
          lng: prevLoc.lng + 0.00005,
          timestamp: new Date(),
        };

        updateLocationInFirestore(newSimulatedLocation);
        return newSimulatedLocation;
      });
    }, 3000);
  };

  // Fonksiyon 2: "Başlat" butonunun mantığı
  const handleStartTracking = async () => {
    if (!currentUser) {
      toast.error("Giriş yapmalısınız.");
      return;
    }
    const docRef = doc(db, "deliveries", gorevId);
    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        toast.error("HATA: Görev bulunamadı.");
        return;
      }
      const data = docSnap.data();
      if (!data.courierId || data.courierId === currentUser.uid) {
        if (data.status === "pending" || data.status === "paused") {
          await updateDoc(docRef, {
            status: "in_progress",
            courierId: currentUser.uid,
          });
        }
        startGeolocationListener();
      } else {
        toast.error("ERİŞİM REDDEDİLDİ: Bu görev başka bir kuryeye aittir.");
      }
    } catch (err) {
      toast.error("Veritabanı hatası: " + err.message);
    }
  };

  // Fonksiyon 3: Konumu Firestore'a günceller
  const updateLocationInFirestore = async (newLocation) => {
    const docRef = doc(db, "deliveries", gorevId);
    try {
      await updateDoc(docRef, {
        currentLocation: newLocation,
        status: "in_progress",
      });
    } catch (e) {
      console.error("Firestore'a yazma hatası: ", e);
    }
  };

  // Fonksiyon 4: Takibi duraklatır (Mola)
  const stopTracking = async () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsTracking(false);
    toast("Takip duraklatıldı (Mola verildi).", { icon: "⏸️" });
    setTaskDetails((prev) => ({ ...prev, status: "paused" }));
    const docRef = doc(db, "deliveries", gorevId);
    try {
      await updateDoc(docRef, {
        status: "paused",
      });
    } catch (err) {
      toast.error("Durum güncellenemedi, ancak takip durduruldu.");
    }
  };

  // Fonksiyon 5: Görevi tamamlar
  const handleCompleteTask = async () => {
    setIsCompleting(true);
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsTracking(false);
    const docRef = doc(db, "deliveries", gorevId);
    try {
      await updateDoc(docRef, {
        status: "delivered",
        currentLocation: null,
        deliveredAt: new Date(),
      });
      setIsCompleting(false);
      toast.success("Görev başarıyla tamamlandı!");
      navigate("/kurye-paneli");
    } catch (err) {
      toast.error("Görevi tamamlarken bir hata oluştu: " + err.message);
      setIsCompleting(false);
    }
  };

  const destinationCoords = taskDetails?.destination
    ? [taskDetails.destination.lat, taskDetails.destination.lng]
    : null;
  const courierCoords = location ? [location.lat, location.lng] : null;

  // --- Render (Görünüm) ---
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl p-8 mx-auto bg-white rounded-lg shadow-lg">
        <Link to="/kurye-paneli" className="text-blue-600 hover:underline">
          &larr; Kurye Paneline Dön
        </Link>
        <h2 className="mt-4 text-3xl font-bold">📍 Kurye Arayüzü</h2>

        {/* Teslimat Detayları */}
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
            <h3 className="text-lg font-semibold text-gray-900">
              Teslimat Detayları
            </h3>
            {taskDetails?.customerName && (
              <div className="mt-2">
                <strong className="text-gray-900">Müşteri:</strong>
                <span className="ml-2 text-sm font-medium text-green-700">
                  {taskDetails.customerName}
                </span>
              </div>
            )}
            {taskDetails?.address ? (
              <div className="mt-2">
                <strong className="text-gray-900">Adres:</strong>
                <p className="text-gray-700">{taskDetails.address}</p>
              </div>
            ) : (
              <p className="text-gray-500">Adres metni bulunamadı.</p>
            )}
            {destinationCoords && (
              <div className="mt-2">
                <a
                  href={`https://www.google.com/maps?q=${destinationCoords[0]},${destinationCoords[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Harici Haritada Aç
                </a>
              </div>
            )}
            {taskDetails?.notes && (
              <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                <strong className="text-yellow-800">Müşteri Notu:</strong>
                <p className="text-yellow-700">{taskDetails.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Harita Bölümü */}
        <div className="mt-6 h-[400px] w-full rounded-lg shadow-md overflow-hidden">
          <MapContainer
            center={destinationCoords || courierCoords || [39.92, 32.86]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {destinationCoords && (
              <Marker position={destinationCoords} icon={homeIcon}>
                <Popup>Teslimat Adresi</Popup>
              </Marker>
            )}
            {courierCoords && (
              <Marker position={courierCoords}>
                <Popup>Siz buradasınız (Simülasyon).</Popup>
              </Marker>
            )}
            <FollowCourierView
              position={courierCoords}
              isTracking={isTracking}
            />
          </MapContainer>
        </div>

        <div className="mt-2 text-center">
          <strong className="text-gray-900">Görev ID:</strong>
          <span className="ml-2 text-sm text-gray-700">{gorevId}</span>
        </div>

        {/* Butonlar */}
        <div className="mt-6 space-y-4">
          {!isTracking ? (
            <button
              onClick={handleStartTracking}
              className="w-full px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              disabled={!!authError || isCompleting}
            >
              {taskDetails?.status === "paused"
                ? "Molayı Bitir ve Devam Et"
                : "Konum Göndermeye Başla"}
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="w-full px-6 py-3 text-lg font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              disabled={isCompleting}
            >
              Takibi Duraklat (Mola Ver)
            </button>
          )}
          {(isTracking ||
            taskDetails?.status === "in_progress" ||
            taskDetails?.status === "assigned" ||
            taskDetails?.status === "paused") && (
            <button
              onClick={handleCompleteTask}
              className="w-full px-6 py-3 text-lg font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              disabled={isCompleting || !!authError}
            >
              {isCompleting
                ? "Tamamlanıyor..."
                : "Görevi Tamamla (Teslim Ettim)"}
            </button>
          )}
        </div>

        {authError && (
          <p className="mt-4 font-bold text-red-600">{authError}</p>
        )}

        {/* 2. YENİ SOHBET BİLEŞENİNİ BURAYA EKLE */}
        {!authError && taskDetails && <SiparisChat gorevId={gorevId} />}
      </div>
    </div>
  );
}

export default KuryeSayfasi;
