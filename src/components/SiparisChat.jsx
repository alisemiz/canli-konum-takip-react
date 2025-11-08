// YENİ DOSYA: src/components/SiparisChat.jsx

import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebaseConfig.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "react-hot-toast";

// Bu bileşen, hangi görev ID'si için çalışacağını 'prop' olarak alır
function SiparisChat({ gorevId }) {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Sohbet kutusunu otomatik olarak en alta kaydırmak için bir ref
  const chatEndRef = useRef(null);

  // 1. MESAJLARI DİNLEME
  useEffect(() => {
    if (!gorevId) return; // Görev ID'si yoksa bir şey yapma

    // Veritabanı yolu: deliveries -> {gorevId} -> messages (alt koleksiyon)
    const messagesColRef = collection(db, "deliveries", gorevId, "messages");

    // Sorgu: Mesajları 'timestamp' (zaman damgası) alanına göre sırala
    const q = query(messagesColRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const msgs = [];
        querySnapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() });
        });
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        console.error("Sohbet dinlenirken hata:", err);
        toast.error("Sohbet mesajları yüklenemedi.");
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Sayfadan çıkınca dinleyiciyi kapat
  }, [gorevId]); // Sadece 'gorevId' değişirse yeniden çalış

  // 2. OTOMATİK AŞAĞI KAYDIRMA
  useEffect(() => {
    // 'messages' dizisi her güncellendiğinde (yeni mesaj geldiğinde)
    // sohbet kutusunu en alta kaydır
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. MESAJ GÖNDERME FONKSİYONU
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim(); // Boşlukları temizle
    if (text === "") return; // Boş mesaj gönderme

    if (!currentUser || !userProfile) {
      toast.error("Mesaj göndermek için giriş yapmalısınız.");
      return;
    }

    setNewMessage(""); // Input'u hemen temizle

    const messagesColRef = collection(db, "deliveries", gorevId, "messages");

    try {
      // 'messages' alt koleksiyonuna yeni bir doküman ekle
      await addDoc(messagesColRef, {
        text: text,
        senderId: currentUser.uid,
        senderName: userProfile.fullName || currentUser.email,
        role: userProfile.role, // 'customer' veya 'courier'
        timestamp: serverTimestamp(), // Sunucu zamanını kullan (sıralama için)
      });
    } catch (err) {
      console.error("Mesaj gönderme hatası:", err);
      toast.error("Mesaj gönderilemedi.");
      setNewMessage(text); // Gönderemediyse text'i geri koy
    }
  };

  // 4. RENDER (GÖRÜNÜM)
  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Sipariş Sohbeti
      </h3>

      {/* Mesaj Listesi */}
      <div className="h-64 max-h-64 overflow-y-auto p-4 bg-gray-100 rounded-lg border border-gray-300 flex flex-col space-y-3">
        {loading && <p className="text-gray-500">Sohbet yükleniyor...</p>}

        {!loading && messages.length === 0 && (
          <p className="text-gray-500 italic text-center">Henüz mesaj yok.</p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            // Mesajın 'senderId'si bizim ID'mizle eşleşiyorsa (bizim mesajımızsa)
            // sağa yasla ve mavi yap
            className={`flex flex-col ${
              msg.senderId === currentUser.uid ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-xs p-3 rounded-lg ${
                msg.senderId === currentUser.uid
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 shadow-sm border"
              }`}
            >
              <p className="text-xs font-bold mb-1 opacity-80">
                {msg.senderName} (
                {msg.role === "customer" ? "Müşteri" : "Kurye"})
              </p>
              <p>{msg.text}</p>
            </div>
            <span className="text-xs text-gray-400 mt-1">
              {msg.timestamp
                ? msg.timestamp
                    .toDate()
                    .toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                : "..."}
            </span>
          </div>
        ))}

        {/* Bu 'div' sohbetin en altıdır, 'chatEndRef' buraya odaklanır */}
        <div ref={chatEndRef} />
      </div>

      {/* Mesaj Gönderme Formu */}
      <form onSubmit={handleSendMessage} className="mt-4 flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Bir mesaj yazın..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={!currentUser}
        />
        <button
          type="submit"
          className="px-6 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          disabled={!currentUser || !newMessage.trim()}
        >
          Gönder
        </button>
      </form>
    </div>
  );
}

export default SiparisChat;
