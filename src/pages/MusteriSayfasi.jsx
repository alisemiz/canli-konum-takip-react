// DOSYA: src/pages/MusteriSayfasi.jsx

import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig.js";
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";
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

// Akıllı Zoom Yardımcısı
function AutoZoom({ driverPos, destPos }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (driverPos && destPos) {
      const bounds = L.latLngBounds([driverPos, destPos]);
      map.flyToBounds(bounds, { padding: [50, 50] });
    } else if (driverPos) {
      map.flyTo(driverPos, 15);
    } else if (destPos) {
      map.flyTo(destPos, 15);
    }
  }, [driverPos, destPos, map]);
  return null;
}

function MusteriSayfasi() {
  const { gorevId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [driverPosition, setDriverPosition] = useState(null);
  const [destination, setDestination] = useState(null);
  const [status, setStatus] = useState("Yükleniyor...");
  const [rawStatus, setRawStatus] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState(null);
  const defaultCenter = [39.925533, 32.866287];

  // Sipariş dinleme
  useEffect(() => {
    if (!gorevId || !currentUser) return;
    const docRef = doc(db, "deliveries", gorevId);

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.customerId !== currentUser.uid) {
            setError("ERİŞİM REDDEDİLDİ: Bu sipariş size ait değil.");
            setStatus("Erişim Reddedildi.");
            setDriverPosition(null);
            return;
          }

          setError(null);
          setRawStatus(data.status);

          if (data.currentLocation) {
            setDriverPosition([
              data.currentLocation.lat,
              data.currentLocation.lng,
            ]);
          } else if (data.status === "delivered") {
            setDriverPosition(null);
          }
          if (data.destination) {
            setDestination([data.destination.lat, data.destination.lng]);
          }

          switch (data.status) {
            case "pending":
              setStatus("Siparişiniz alındı, kurye bekleniyor...");
              break;
            case "assigned":
              setStatus(
                data.courierName
                  ? `Kuryeniz ${data.courierName} atandı...`
                  : "Bir kurye atandı..."
              );
              break;
            case "in_progress":
              setStatus(
                data.courierName
                  ? `Kuryeniz ${data.courierName} yolda!`
                  : "Kuryeniz yolda!"
              );
              break;
            case "paused":
              setStatus(
                data.courierName
                  ? `Kuryeniz ${data.courierName} mola veriyor.`
                  : "Kuryeniz mola veriyor."
              );
              break;
            case "delivered":
              setStatus("Siparişiniz teslim edildi.");
              break;
            default:
              setStatus("Sipariş durumu bilinmiyor.");
          }
        } else {
          setError("Bu sipariş iptal edildi veya bulunamadı.");
          setStatus("Sipariş bulunamadı.");
          setDriverPosition(null);
          setDestination(null);
        }
      },
      (err) => {
        console.error("Sipariş dinlerken hata:", err);
        toast.error("Sipariş dinlenirken bir hata oluştu: " + err.message);
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [gorevId, currentUser]);

  // İptal etme fonksiyonu
  const handleCancelOrder = async () => {
    setIsCancelling(true);
    const docRef = doc(db, "deliveries", gorevId);
    try {
      await deleteDoc(docRef);
      toast.success("Sipariş başarıyla iptal edildi.");
      setTimeout(() => {
        navigate("/siparislerim");
      }, 2000);
    } catch (err) {
      console.error("İptal etme hatası:", err);
      toast.error("Sipariş iptal edilirken bir hata oluştu: " + err.message);
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl p-8 mx-auto bg-white rounded-lg shadow-lg">
        <Link to="/siparislerim" className="text-blue-600 hover:underline">
          &larr; Tüm Siparişlerime Dön
        </Link>
        <h2 className="mt-4 text-3xl font-bold">🗺️ Sipariş Takip Arayüzü</h2>

        <div className="mt-4">
          <strong className="text-gray-900">İzlenen Sipariş ID:</strong>
          <span className="ml-2 text-sm text-gray-700">{gorevId}</span>
        </div>
        <p className="mt-2 text-lg">
          Durum:
          <strong
            className={
              status.includes("teslim edildi")
                ? "text-green-600"
                : status.includes("mola")
                ? "text-yellow-600"
                : status.includes("Reddedildi")
                ? "text-red-600"
                : "text-blue-600"
            }
          >
            {" "}
            {status}
          </strong>
        </p>

        {error && <p className="mt-4 font-bold text-red-600">{error}</p>}

        {/* Hata yoksa haritayı göster */}
        {!error && (
          <div className="mt-6 h-[500px] w-full rounded-lg shadow-md overflow-hidden">
            <MapContainer
              center={destination || defaultCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {driverPosition && (
                <Marker position={driverPosition}>
                  <Popup>Kuryeniz burada!</Popup>
                </Marker>
              )}
              {destination && (
                <Marker position={destination} icon={homeIcon}>
                  <Popup>Teslimat adresiniz burası.</Popup>
                </Marker>
              )}
              <AutoZoom driverPos={driverPosition} destPos={destination} />
            </MapContainer>
          </div>
        )}

        {/* İptal Et Butonu: Sadece 'pending' durumunda göster */}
        {rawStatus === "pending" && !error && (
          <div className="mt-6 text-center">
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="px-6 py-3 text-lg font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              {isCancelling ? "İptal ediliyor..." : "SİPARİŞİ İPTAL ET"}
            </button>
          </div>
        )}

        {/* 2. YENİ SOHBET BİLEŞENİNİ BURAYA EKLE */}
        {/* Sadece sipariş varsa ve hata yoksa sohbeti göster */}
        {!error && rawStatus && <SiparisChat gorevId={gorevId} />}
      </div>
    </div>
  );
}

export default MusteriSayfasi;
