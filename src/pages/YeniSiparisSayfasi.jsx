// DOSYA: src/pages/YeniSiparisSayfasi.jsx
// Sürüm: Tıklayarak Pin Ekleme (Tüm Hatalar Düzeltilmiş)

import React, { useState, useEffect } from "react"; // useEffect eklendi
import { useNavigate, Link } from "react-router-dom";
import { db } from "../firebaseConfig.js";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "react-hot-toast";

// 1. GEREKLİ TÜM HARİTA BİLEŞENLERİ
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// 2. (ÇOK ÖNEMLİ) PİN GÖRÜNME HATASI DÜZELTMESİ
// Leaflet'in varsayılan pin ikonlarını manuel olarak yüklüyoruz.
// Bu olmadan, pin görünmez olur.
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41], // Pin'in ucunun tam koordinata gelmesini sağlar
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;
// (Pin Düzeltmesi Bitti)

// 3. YARDIMCI BİLEŞEN: Haritaya Tıklamayı Dinleyen VE GRİ EKRANI DÜZELTEN
function LocationPicker({ onLocationSelect }) {
  const map = useMapEvents({
    click(e) {
      // Haritada bir yere tıklandığında
      onLocationSelect(e.latlng); // Parent component'in state'ini (destination) güncelle
      map.flyTo(e.latlng, map.getZoom()); // Haritayı tıkladığın yere uçur
    },
  });

  // 4. (ÇOK ÖNEMLİ) "GRİ EKRAN" HATASI DÜZELTMESİ
  // Bu bileşen (ve harita) yüklendikten hemen sonra,
  // haritaya boyutlarını yeniden hesaplaması için komut gönderir.
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200); // 200ms gecikme

    return () => clearTimeout(timer); // Cleanup
  }, [map]); // Harita hazır olduğunda bir kez çalışır

  // Bu bileşen, haritaya sadece "tıklama" ve "düzeltme" özelliği ekler
  return null;
}

function YeniSiparisSayfasi() {
  const [loading, setLoading] = useState(false);
  // 5. 'destination' state'i artık tıklanan pin'in koordinatlarını tutacak
  const [destination, setDestination] = useState(null);
  const [notes, setNotes] = useState("");
  // Adres metnini tutmak için
  const [addressString, setAddressString] = useState(
    "Lütfen haritadan bir nokta seçin."
  );
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  // 6. YENİ YARDIMCI FONKSİYON: Koordinattan Adres Alma
  const fetchAddressFromCoords = async (lat, lng) => {
    setIsGeocoding(true);
    setAddressString("Adres alınıyor...");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddressString(data.display_name); // Gelen adresi (örn: "Atatürk Blv, Çankaya...") state'e yaz
      } else {
        setAddressString("Adres detayı bulunamadı.");
      }
    } catch (err) {
      console.error("Adres alma hatası:", err);
      setAddressString("Adres alınamadı. Koordinatlar kullanılacak.");
    }
    setIsGeocoding(false);
  };

  // 7. TIKLAMA İLE ÇALIŞAN FONKSİYON
  // 'LocationPicker' bu fonksiyonu tetikleyecek
  const handleMapClick = (latlng) => {
    setDestination(latlng); // Pin'in yerini ayarla
    fetchAddressFromCoords(latlng.lat, latlng.lng); // Adresi çek
  };

  const handleCreateOrder = async () => {
    setLoading(true);

    if (!currentUser) {
      toast.error("Sipariş oluşturmak için giriş yapmış olmalısınız.");
      setLoading(false);
      return;
    }

    // 8. (HATA DÜZELTMESİ) Artık 'destination' null ise buton zaten kilitli
    // Ama yine de kontrol ediyoruz.
    if (!destination) {
      toast.error("Lütfen haritadan bir teslimat adresi seçin.");
      setLoading(false);
      return;
    }
    if (isGeocoding) {
      toast.error("Adres bilgisi yükleniyor, lütfen bekleyin.");
      setLoading(false);
      return;
    }

    try {
      const deliveriesCollection = collection(db, "deliveries");

      const newOrderData = {
        customerId: currentUser.uid,
        customerEmail: currentUser.email,
        customerName: userProfile?.fullName || currentUser.email,
        status: "pending",
        createdAt: new Date(),
        courierId: null,
        courierName: null,
        destination: {
          // Koordinatları kaydet
          lat: destination.lat,
          lng: destination.lng,
        },
        address: addressString, // Okunabilir adresi kaydet
        notes: notes,
      };

      const docRef = await addDoc(deliveriesCollection, newOrderData);

      toast.success("Siparişiniz başarıyla oluşturuldu!");
      setLoading(false);
      navigate(`/musteri/${docRef.id}`);
    } catch (err) {
      console.error("Sipariş oluşturma hatası:", err);
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl p-8 mx-auto mt-10 bg-white rounded-lg shadow-lg">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Ana Sayfaya Dön
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-center">
          Yeni Sipariş Oluştur
        </h2>

        <div className="mt-6 space-y-4 text-left">
          {/* 9. Harita Alanı */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teslimat Adresi (Lütfen haritadan bir yere tıklayın)
            </label>
            <div className="mt-2 h-[400px] w-full rounded-lg shadow-md overflow-hidden">
              <MapContainer
                center={[39.9255, 32.8663]} // Ankara
                zoom={12}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* 10. Tıklama dinleyicimizi ve "Gri Ekran" düzelticimizi ekliyoruz */}
                <LocationPicker onLocationSelect={handleMapClick} />

                {/* 11. YENİ PİN (MARKER):
                    'destination' state'i doluysa, pin'i haritaya koy. */}
                {destination && (
                  <Marker position={destination}>
                    <Popup>Teslimat adresi burası.</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            {/* 12. "Yükleniyor..." hatasını düzeltme:
                 'addressString' state'ini göster */}
            <div className="mt-2 text-sm p-3 bg-gray-100 rounded">
              <strong className="text-gray-900">Seçilen Adres:</strong>
              <p
                className={`mt-1 ${
                  isGeocoding
                    ? "text-gray-500 italic"
                    : "text-green-600 font-medium"
                }`}
              >
                {addressString}
              </p>
            </div>
          </div>

          {/* Notlar alanı (Değişiklik yok) */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Kurye için Notlar (Opsiyonel)
            </label>
            <input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Örn: Zil bozuk, lütfen arayın."
            />
          </div>
        </div>

        <button
          onClick={handleCreateOrder}
          // 13. (HATA DÜZELTMESİ) Buton, pin seçilmeden VEYA adres yüklenirken kilitli
          disabled={loading || !destination || isGeocoding}
          className="w-full px-8 py-3 mt-8 text-lg font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Oluşturuluyor..." : "Siparişi Onayla ve Takibe Başla"}
        </button>
      </div>
    </div>
  );
}

export default YeniSiparisSayfasi;
