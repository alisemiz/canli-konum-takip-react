// DOSYA: src/pages/KuryePaneli.jsx (Tamamlanmış Görevler Bölümü Eklenmiş Hali)

import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// 1. StarRating bileşenini import et (Puanları göstermek için)
import StarRating from "../components/StarRating.jsx";

function KuryePaneli() {
  // 2. YENİ STATE: Tamamlanmış görevler için
  const [activeTasks, setActiveTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]); // YENİ

  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(true); // YENİ

  const [claimLoading, setClaimLoading] = useState(null);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      setLoadingActive(false);
      setLoadingPending(false);
      setLoadingCompleted(false); // YENİ
      return;
    }

    const deliveriesCollection = collection(db, "deliveries");

    // --- SORGU 1: Aktif Görevlerim (Değişiklik yok) ---
    const activeQuery = query(
      deliveriesCollection,
      where("courierId", "==", currentUser.uid),
      where("status", "in", ["assigned", "in_progress", "paused"])
    );
    const unsubscribeActive = onSnapshot(
      activeQuery,
      (querySnapshot) => {
        const tasks = [];
        querySnapshot.forEach((doc) => {
          tasks.push({ id: doc.id, ...doc.data() });
        });
        setActiveTasks(tasks);
        setLoadingActive(false);
      },
      (err) => {
        console.error("Aktif görevleri dinlerken hata:", err);
        toast.error("Aktif görevler yüklenemedi: " + err.message);
        setLoadingActive(false);
      }
    );

    // --- SORGU 2: Bekleyen Görevler (Değişiklik yok) ---
    const pendingQuery = query(
      deliveriesCollection,
      where("status", "==", "pending"),
      where("customerId", "!=", currentUser.uid)
    );
    const unsubscribePending = onSnapshot(
      pendingQuery,
      (querySnapshot) => {
        const tasks = [];
        querySnapshot.forEach((doc) => {
          tasks.push({ id: doc.id, ...doc.data() });
        });
        setPendingTasks(tasks);
        setLoadingPending(false);
      },
      (err) => {
        console.error("Bekleyen görevleri dinlerken hata:", err);
        toast.error("Bekleyen görevler yüklenemedi: " + err.message);
        setLoadingPending(false);
      }
    );

    // 3. YENİ SORGU: Tamamlanmış Görevlerim
    const completedQuery = query(
      deliveriesCollection,
      where("courierId", "==", currentUser.uid),
      where("status", "==", "delivered")
      // (Buraya 'orderBy' eklersek index gerekir, şimdilik JS ile sıralayalım)
    );
    const unsubscribeCompleted = onSnapshot(
      completedQuery,
      (querySnapshot) => {
        const tasks = [];
        querySnapshot.forEach((doc) => {
          tasks.push({ id: doc.id, ...doc.data() });
        });
        // JS ile en yeni üste
        tasks.sort(
          (a, b) =>
            (b.deliveredAt?.toDate() || 0) - (a.deliveredAt?.toDate() || 0)
        );
        setCompletedTasks(tasks);
        setLoadingCompleted(false);
      },
      (err) => {
        console.error("Tamamlanmış görevleri dinlerken hata:", err);
        // UYARI: Bu sorgu da (courierId == ... VE status == 'delivered')
        // yeni bir Firestore Dizini (index) gerektirebilir.
        toast.error("Tamamlanmış görevler yüklenemedi: " + err.message);
        setLoadingCompleted(false);
      }
    );

    // 4. 3 adet dinleyiciyi de kapat
    return () => {
      unsubscribeActive();
      unsubscribePending();
      unsubscribeCompleted(); // YENİ
    };
  }, [currentUser]);

  // --- (handleClaimTask ve getStatusLabel fonksiyonları aynı) ---
  const handleClaimTask = async (task) => {
    if (!currentUser || !userProfile) {
      toast.error("Giriş yapmış olmalısınız.");
      return;
    }
    if (task.customerId === currentUser.uid) {
      toast.error("Kendi siparişinizi sahiplenemezsiniz!");
      return;
    }
    setClaimLoading(task.id);
    try {
      const taskDocRef = doc(db, "deliveries", task.id);
      await updateDoc(taskDocRef, {
        status: "assigned",
        courierId: currentUser.uid,
        courierName: userProfile?.fullName || currentUser.email,
      });
      toast.success("Görev başarıyla sahiplenildi!");
      navigate(`/kurye/${task.id}`);
    } catch (err) {
      toast.error("Görevi sahiplenirken bir hata oluştu: " + err.message);
      setClaimLoading(null);
    }
  };
  const getStatusLabel = (status) => {
    switch (status) {
      case "assigned":
        return "Atandı (Başlamanız bekleniyor)";
      case "in_progress":
        return "Yolda (Devam ediyor)";
      case "paused":
        return "Molada (Duraklatıldı)";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Ana Sayfaya Dön
        </Link>
        <h2 className="mt-4 text-3xl font-bold">Kurye Paneli</h2>

        {/* --- BÖLÜM 1: AKTİF GÖREVLERİM (Değişiklik yok) --- */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-orange-600">
            Aktif Görevlerim
          </h3>
          {loadingActive ? (
            <p className="mt-2">Aktif görevler yükleniyor...</p>
          ) : activeTasks.length === 0 ? (
            <p className="mt-2 italic text-gray-500">
              Şu anda devam eden aktif bir göreviniz bulunmamaktadır.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/kurye/${task.id}`}
                  className="block p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  {task.customerName && (
                    <div className="mb-2">
                      <strong className="text-gray-900">Müşteri:</strong>
                      <span className="ml-2 text-sm font-medium text-green-700">
                        {task.customerName}
                      </span>
                    </div>
                  )}
                  {task.address ? (
                    <div className="mb-2">
                      <strong className="text-gray-900">Adres:</strong>
                      <span className="ml-2 text-sm text-gray-700 truncate">
                        {task.address}
                      </span>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <strong className="text-gray-900">Adres:</strong>{" "}
                      <span className="ml-2 text-sm text-red-500">
                        Belirtilmemiş
                      </span>
                    </div>
                  )}
                  <div>
                    <strong className="text-gray-900">Durum:</strong>
                    <span className="ml-2 font-semibold text-orange-600">
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* --- BÖLÜM 2: BEKLEYEN GÖREVLER (Değişiklik yok) --- */}
        <div className="mt-12">
          <h3 className="text-2xl font-semibold text-blue-600">
            Bekleyen Siparişler
          </h3>
          {loadingPending ? (
            <p className="mt-2">Bekleyen siparişler yükleniyor...</p>
          ) : pendingTasks.length === 0 ? (
            <p className="mt-2 italic text-gray-500">
              Şu anda sahiplenilmeyi bekleyen yeni sipariş bulunmamaktadır.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col items-start justify-between p-4 bg-white rounded-lg shadow-md md:flex-row md:items-center"
                >
                  <div className="flex-1 mb-4 md:mb-0">
                    {task.customerName && (
                      <div className="mb-2">
                        <strong className="text-gray-900">Müşteri:</strong>{" "}
                        <span className="ml-2 text-sm font-medium text-green-700">
                          {task.customerName}
                        </span>
                      </div>
                    )}
                    {task.address ? (
                      <div className="mb-2">
                        <strong className="text-gray-900">Adres:</strong>{" "}
                        <span className="ml-2 text-sm text-gray-700">
                          {task.address}
                        </span>
                      </div>
                    ) : (
                      <div className="mb-2">
                        <strong className="text-gray-900">Adres:</strong>{" "}
                        <span className="ml-2 text-sm text-red-500">
                          Belirtilmemiş
                        </span>
                      </div>
                    )}
                    <strong className="text-gray-900">Sipariş Tarihi:</strong>
                    <span className="ml-2 text-sm text-gray-700">
                      {task.createdAt?.toDate().toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleClaimTask(task)}
                    disabled={claimLoading === task.id}
                    className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {claimLoading === task.id
                      ? "Sahipleniliyor..."
                      : "Görevi Sahiplen"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. YENİ BÖLÜM: TAMAMLANMIŞ GÖREVLERİM */}
        <div className="mt-12">
          <h3 className="text-2xl font-semibold text-green-600">
            Tamamlanmış Görevlerim
          </h3>
          {loadingCompleted ? (
            <p className="mt-2">Tamamlanmış görevler yükleniyor...</p>
          ) : completedTasks.length === 0 ? (
            <p className="mt-2 italic text-gray-500">
              Henüz tamamlanmış bir göreviniz bulunmamaktadır.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col items-start justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 md:flex-row md:items-center"
                >
                  <div className="flex-1 mb-4 md:mb-0">
                    {task.customerName && (
                      <div className="mb-2">
                        <strong className="text-gray-900">Müşteri:</strong>
                        <span className="ml-2 text-sm font-medium text-green-700">
                          {task.customerName}
                        </span>
                      </div>
                    )}
                    {task.address && (
                      <div className="mb-2">
                        <strong className="text-gray-900">Adres:</strong>
                        <span className="ml-2 text-sm text-gray-700 truncate">
                          {task.address}
                        </span>
                      </div>
                    )}
                    <strong className="text-gray-900">Teslim Tarihi:</strong>
                    <span className="ml-2 text-sm text-gray-700">
                      {task.deliveredAt?.toDate().toLocaleString("tr-TR")}
                    </span>
                  </div>

                  {/* PUANLAMA BİLGİSİ */}
                  <div className="text-right">
                    {task.rating ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Alınan Puan:
                        </p>
                        <StarRating
                          initialRating={task.rating}
                          disabled={true}
                        />
                      </div>
                    ) : (
                      <p className="text-sm italic text-gray-500">
                        Henüz Puanlanmadı
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KuryePaneli;
