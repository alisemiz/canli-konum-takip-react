// DOSYA: src/pages/AnaSayfa.jsx

import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { auth } from "../firebaseConfig.js";
import { signOut } from "firebase/auth";

function AnaSayfa() {
  const navigate = useNavigate();
  // 1. 'userProfile' bilgisini al (içinde 'role' var)
  const { currentUser, userProfile } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Çıkış hatası:", err);
    }
  };

  // 2. Kullanıcının rolünü bir değişkene al
  const userRole = userProfile?.role; // 'customer', 'courier' veya 'undefined' olabilir

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Kullanıcı Karşılama ve Çıkış */}
      <div className="absolute top-4 right-4">
        {currentUser && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700 font-medium">
              Merhaba, {userProfile?.fullName || currentUser.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Çıkış Yap
            </button>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto mt-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Canlı Konum Takip Projesi
        </h1>

        {/* 3. Hoşgeldin mesajını role göre özelleştir */}
        <p className="mt-4 text-lg text-gray-600">
          {userRole === "customer" &&
            "Siparişlerinizi yönetmek için hazırsınız."}
          {userRole === "courier" && "Görev panelinize hoş geldiniz."}
          {!userRole && "Ana panele hoş geldiniz."}
        </p>

        <div className="flex flex-col items-center mt-12 space-y-8 md:flex-row md:space-y-0 md:space-x-8 md:justify-center">
          {/* 4. Müşteri Kartı (SADECE ROL 'customer' İSE GÖSTER) */}
          {userRole === "customer" && (
            <div className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-green-600">Müşteriyim</h2>
              <p className="mt-4 text-gray-600">
                Yeni bir teslimat siparişi oluşturun veya geçmiş siparişlerinizi
                görün.
              </p>
              <div className="flex flex-col items-center mt-6 space-y-4">
                <Link
                  to="/yeni-siparis"
                  className="inline-block w-full px-6 py-3 text-lg font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Yeni Sipariş Ver
                </Link>
                <Link
                  to="/siparislerim"
                  className="inline-block w-full px-6 py-3 text-lg font-medium text-white bg-gray-500 rounded-lg hover:bg-gray-600"
                >
                  Siparişlerimi Gör
                </Link>
              </div>
            </div>
          )}

          {/* 5. Kurye Kartı (SADECE ROL 'courier' İSE GÖSTER) */}
          {userRole === "courier" && (
            <div className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-blue-600">Kuryeyim</h2>
              <p className="mt-4 text-gray-600">
                Yeni bir görev alın veya devam eden görevlerinizi yönetin.
              </p>
              <Link
                to="/kurye-paneli"
                className="inline-block w-full px-6 py-3 mt-6 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Kurye Paneline Git
              </Link>
            </div>
          )}

          {/* 6. Rol Yoksa (Eski kullanıcılar için bir mesaj) */}
          {!userRole && (
            <div className="p-8 text-center text-gray-600">
              <p>Hesabınız için bir rol tanımlanmamış.</p>
              <p>
                (Eğer bu eski bir hesapsa, lütfen 'rol' bilgisiyle yeni bir
                hesap açın.)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnaSayfa;
