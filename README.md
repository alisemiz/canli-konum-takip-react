# 📍 Canlı Konum Takip Prototipi (React + Firebase)

Bu proje, sadece bir "demo" olmanın ötesinde, **Getir**, **Uber** veya **Trendyol Go** gibi modern lojistik ve teslimat uygulamalarının temel mantığını sıfırdan inşa etme denemesidir.

Uygulamanın kalbi, **Firebase Firestore**'un gerçek zamanlı (`onSnapshot`) yeteneklerini kullanarak, Müşteri ve Kurye rollerini tamamen ayırmak ve aralarındaki tüm etkileşimi (konum takibi, sohbet, puanlama) canlı olarak yönetmektir.

---
## Link:
https://canli-kurye-takip.web.app

## ✨ Temel Özellikler (Features)

Proje, tam bir teslimat döngüsünü yönetecek şekilde tasarlanmıştır:

### 1. Kullanıcı & Rol Yönetimi
* **Rol Bazlı Kimlik Doğrulama:** Kullanıcılar kayıt olurken **"Müşteri"** veya **"Kurye"** rolünü seçerler.
* **Yetkilendirme:** Ana sayfa, giriş yapan kullanıcının rolüne (`userProfile.role`) göre dinamik olarak değişir. Müşteriler kurye panelini, kuryeler de sipariş verme ekranını göremez.
* **Profil Yönetimi:** Kullanıcı kayıtları (Auth) ve profil bilgileri (Ad/Soyad, Rol) (Firestore `users` koleksiyonu) ayrı yönetilir.

### 2. Müşteri Deneyimi (`customer` rolü)
* **Haritadan Adres Seçme:** Müşteriler, sıkıcı adres formları yerine, `react-leaflet` haritası üzerinden tıklayarak teslimat pin'i 🏠 bırakır.
* **Ters Coğrafi Kodlama:** Haritadan seçilen koordinatlar (`lat`, `lng`), anlık olarak `Nominatim API`'sine (OpenStreetMap) sorularak okunabilir bir adrese ("Atatürk Bulvarı, Çankaya...") dönüştürülür.
* **Siparişlerim Sayfası:** Müşteriler, `customerId`'ye göre filtrelenen ve (istemci tarafında) tarihe göre sıralanan tüm geçmiş ve aktif siparişlerini görebilir.
* **Sipariş İptali:** Müşteriler, henüz bir kurye tarafından sahiplenilmemiş (`status: 'pending'`) siparişlerini iptal edebilir (`deleteDoc`).
* **Puanlama:** Teslim edilmiş (`status: 'delivered'`) ve henüz puanlanmamış siparişler için 5 yıldızlı (⭐️) bir değerlendirme sistemi sunar.

### 3. Müşteri Takip Deneyimi
* **Çift Pinli Canlı Takip:** Müşteri, takip ekranında *hem* kuryenin anlık konumunu (📍 - hareketli), *hem de* kendi teslimat hedefini (🏠 - sabit) aynı haritada görür.
* **Akıllı Zoom:** Harita, (`flyToBounds` kullanarak) her iki pini de ekrana sığdıracak şekilde otomatik olarak odaklanır.

### 4. Kurye Deneyimi (`courier` rolü)
* **Birleşik Kurye Paneli:** Kuryeler, tek bir panelde (`/kurye-paneli`) üç farklı sorguyla beslenen listeleri görür:
    1.  **Aktif Görevlerim:** Kendi sahiplendiği (`courierId == ...`) ve henüz tamamlamadığı (`status != 'delivered'`) görevler.
    2.  **Bekleyen Siparişler:** `status == 'pending'` olan VE *kendi oluşturmadığı* (`customerId != ...`) tüm görevler.
    3.  **Tamamlanmış Görevlerim:** Tamamladığı (`status == 'delivered'`) görevler ve müşterilerden aldığı puanlar (⭐️).
* **Navigasyon Ekranı:** Kurye, bir görevi sahiplendiğinde, müşterinin adresini (🏠), müşteri notlarını ve kendi anlık konumunu (📍) gösteren bir harita görür.
* **Görev Akışı:** Kurye, takibi duraklatabilir (`status: 'paused'`), devam ettirebilir (`status: 'in_progress'`) veya tamamlayabilir (`status: 'delivered'`).
* **Konum Simülasyonu:** Gerçek GPS sinyali olmayan (örn: "okul interneti", masaüstü) ortamlarda test yapabilmek için "Konum Göndermeye Başla" butonu, `Timeout` hatalarını aşmak için *sahte* ama *hareketli* bir konum simülasyonu (`setInterval`) başlatır.

### 5. Gerçek Zamanlı İletişim
* **Canlı Sipariş Sohbeti:** Her sipariş dokümanının altında (`deliveries/{id}/messages`) özel bir **alt koleksiyon (subcollection)** bulunur. Müşteri ve Kurye, bu oda üzerinden gerçek zamanlı olarak mesajlaşabilir.
* **Modern Bildirimler:** Tüm hata, başarı veya bilgi mesajları için `alert()` yerine `react-hot-toast` kullanılır.

---

## 🛠️ Kullanılan Teknolojiler

* **Frontend:** React (Vite)
* **Backend & Veritabanı:** Firebase (Authentication, Firestore)
* **Sayfa Yönetimi:** React Router DOM
* **Stil:** Tailwind CSS
* **Haritalar:** React Leaflet & OpenStreetMap (Nominatim API)
* **Bildirimler:** React Hot Toast

---

## ⚙️ Kurulum ve Çalıştırma

Bu projeyi yerel makinenizde çalıştırmak için:

1.  **Depoyu klonlayın:**
    ```bash
    git clone [BU_DEPO_LINKI]
    cd canli-konum-takip
    ```

2.  **Bağımlılıkları yükleyin:**
    ```bash
    npm install
    ```

3.  **Firebase Projesi Oluşturun:**
    * [Firebase Konsolu](https://console.firebase.google.com/)'nda yeni bir proje oluşturun.
    * **Authentication**'ı açın ve **"E-posta/Şifre"** sağlayıcısını etkinleştirin.
    * **Cloud Firestore**'u "Test Modunda" başlatın.

4.  **.env Dosyasını Oluşturun:**
    * Proje ana dizininde `.env` adında bir dosya oluşturun.
    * Firebase projenizin "Proje Ayarları"ndan aldığınız **Web Uygulaması Yapılandırma** (config) bilgilerini bu dosyaya `VITE_` önekiyle ekleyin:
    ```
    VITE_FIREBASE_API_KEY=AIza...
    VITE_FIREBASE_AUTH_DOMAIN=proje-adi.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=proje-adi
    VITE_FIREBASE_STORAGE_BUCKET=proje-adi.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...
    ```

5.  **Geliştirme Sunucusunu Başlatın:**
    ```bash
    npm run dev
    ```

---

## ⚠️ ÖNEMLİ: Firestore Dizin (Index) Gereksinimleri

Bu proje, "Kurye Paneli" ve "Siparişlerim" (eğer `orderBy` kullanırsanız) gibi sayfalarda birden fazla `where` ve `orderBy` kuralı içeren karmaşık Firestore sorguları kullanır.

Uygulamayı çalıştırıp (Kurye veya Müşteri olarak) bu sayfalara ilk kez girdiğinizde, ekranın sağ üst köşesinde **`Bekleyen görevler yüklenemedi: The query requires an index...`** şeklinde bir hata bildirimi alacaksınız.

**Bu bir hata değildir.** Bu, Firestore'un bu karmaşık sorguları hızlı çalıştırabilmek için sizden onay istediğini gösterir.

**Çözüm:**
1.  Hata bildirimindeki **uzun `https://console.firebase.google.com/...` linkine tıklayın.**
2.  Açılan Firebase sayfasında (içi zaten doldurulmuş olacaktır) **"Oluştur" (Create)** butonuna basın.
3.  Bu işlemi, hata aldığınız **her farklı sorgu için** (toplamda 2 veya 3 kez) tekrarlayın.
4.  Dizinlerin "Dizinler" sekmesinde **"Etkin" (Enabled)** olması 3-5 dakika sürebilir.

Dizinler etkinleştiğinde, sayfayı yenileyin. Uygulama tam olarak çalışacaktır.
