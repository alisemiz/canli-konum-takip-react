// DOSYA: src/pages/RegisterPage.jsx

import React, { useState } from "react";
import { auth, db } from "../firebaseConfig.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !role) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);

    try {
      // 1. Kullanıcıyı Auth'ta oluştur
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. Kullanıcı profilini Firestore'a yaz
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        fullName: fullName,
        role: role,
      });

      // 3. (ÖNEMLİ) Kayıt olan kullanıcıyı Auth'tan hemen "çıkış yaptır".
      // Bu, bir sonraki adımda 'login'e gittiğinde 'zaten giriş yapmış'
      // olarak algılanmasını engeller.
      await auth.signOut();

      setLoading(false);

      // 4. GÜNCELLEME: Artık Ana Sayfaya ('/') değil, Giriş Sayfasına ('/login') yönlendir
      toast.success("Hesap başarıyla oluşturuldu! Lütfen giriş yapın.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    // ... (Formun geri kalan JSX/HTML kısmı aynı, değişiklik yok) ...
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Kayıt Ol</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ad Soyad:
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Şifre:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rolünüz:
            </label>
            <div className="flex items-center mt-2 space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="customer"
                  checked={role === "customer"}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Müşteriyim</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="courier"
                  checked={role === "courier"}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Kuryeyim</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {loading ? "Kayıt Olunuyor..." : "Kayıt Ol"}
          </button>
        </form>
        <p className="text-sm text-center text-gray-600">
          Zaten bir hesabınız var mı?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Giriş Yapın
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
