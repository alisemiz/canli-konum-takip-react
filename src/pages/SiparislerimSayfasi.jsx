// DOSYA: src/pages/SiparislerimSayfasi.jsx (Tam ve Son Hali)

import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

// Puanlama (Yıldız) bileşenini import et
import StarRating from "../components/StarRating.jsx";

function SiparislerimSayfasi() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [cancellingId, setCancellingId] = useState(null);
  const [ratingLoadingId, setRatingLoadingId] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const deliveriesCollection = collection(db, "deliveries");

    // (Sıralamayı JS tarafında yaptığımız versiyon - index hatası almamak için)
    const q = query(
      deliveriesCollection,
      where("customerId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const customerOrders = [];
        querySnapshot.forEach((doc) => {
          customerOrders.push({ id: doc.id, ...doc.data() });
        });
        // JavaScript ile sıralama (en yeni üstte)
        customerOrders.sort((a, b) => {
          const dateA = a.createdAt?.toDate() || 0;
          const dateB = b.createdAt?.toDate() || 0;
          return dateB - dateA;
        });
        setOrders(customerOrders);
        setLoading(false);
      },
      (err) => {
        console.error("Siparişleri dinlerken hata:", err);
        toast.error("Siparişler yüklenemedi: " + err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  // Siparişi İptal Etme Fonksiyonu
  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    const docRef = doc(db, "deliveries", orderId);
    try {
      await deleteDoc(docRef);
      toast.success("Sipariş başarıyla iptal edildi.");
    } catch (err) {
      console.error("İptal etme hatası:", err);
      toast.error("Sipariş iptal edilirken bir hata oluştu: " + err.message);
      setCancellingId(null);
    }
  };

  // Puanı Veritabanına Yazma Fonksiyonu
  const handleRatingSubmit = async (orderId, rating) => {
    setRatingLoadingId(orderId);
    const docRef = doc(db, "deliveries", orderId);
    try {
      await updateDoc(docRef, {
        rating: rating,
      });
      // (StarRating bileşeni kendi toast'unu zaten gösteriyor)
    } catch (err) {
      console.error("Puanlama hatası:", err);
      toast.error("Puan verilirken bir hata oluştu.");
    }
    setRatingLoadingId(null);
  };

  // --- Helper fonksiyonlar ---
  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Kurye Bekleniyor";
      case "assigned":
        return "Kurye Atandı";
      case "in_progress":
        return "Yolda";
      case "paused":
        return "Kurye Molada";
      case "delivered":
        return "Teslim Edildi";
      default:
        return status;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "text-green-600";
      case "in_progress":
        return "text-blue-600";
      case "paused":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Ana Sayfaya Dön
        </Link>
        <h2 className="mt-4 text-3xl font-bold">Siparişlerim</h2>
        <p className="mt-2 text-gray-600">
          Geçmiş ve devam eden tüm siparişleriniz:
        </p>

        {loading && <p className="mt-6">Siparişler yükleniyor...</p>}

        {!loading && orders.length === 0 && (
          <p className="mt-6 italic text-gray-500">
            Henüz hiç sipariş vermemişsiniz.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="block p-4 bg-white rounded-lg shadow-md"
            >
              {/* 1. DÜZELTME: Sipariş Detayları (Tarih, ID, Durum) */}
              <div className="flex justify-between items-start">
                {/* Sol taraf: Sipariş Bilgisi (Tıklanabilir) */}
                <Link to={`/musteri/${order.id}`} className="flex-1">
                  <div>
                    <strong className="text-gray-900">Sipariş Tarihi:</strong>
                    <span className="ml-2 text-sm text-gray-700">
                      {order.createdAt?.toDate().toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <div className="mt-2">
                    <strong className="text-gray-900">Sipariş ID:</strong>
                    <span className="ml-2 text-xs text-gray-500">
                      {order.id}
                    </span>
                  </div>
                </Link>
                {/* Sağ taraf: Durum Bilgisi */}
                <span
                  className={`font-semibold ${getStatusColor(order.status)}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* 2. DÜZELTME: Butonlar ve Puanlama (Tam Hali) */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                {/* Sol Taraf: Takip/İptal Butonları */}
                <div>
                  {order.status !== "delivered" && (
                    <Link
                      to={`/musteri/${order.id}`}
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Takip Et
                    </Link>
                  )}
                  {order.status === "pending" && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                      className="px-3 py-2 ml-4 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {cancellingId === order.id
                        ? "İptal..."
                        : "Siparişi İptal Et"}
                    </button>
                  )}
                </div>

                {/* Sağ Taraf: Puanlama Alanı */}
                <div>
                  {/* Durum 'teslim edildi' VE 'rating' henüz verilmemişse: */}
                  {order.status === "delivered" && !order.rating && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">
                        Teslimatı Puanla:
                      </p>
                      <StarRating
                        onRatingSubmit={(rating) =>
                          handleRatingSubmit(order.id, rating)
                        }
                        disabled={ratingLoadingId === order.id}
                      />
                    </div>
                  )}
                  {/* Durum 'teslim edildi' VE 'rating' verilmişse: */}
                  {order.status === "delivered" && order.rating && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Puanınız:</p>
                      <StarRating
                        initialRating={order.rating}
                        disabled={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SiparislerimSayfasi;
