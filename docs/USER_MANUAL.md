# User Manual - Campus Management System

## 📖 Kullanıcı Kılavuzu

Bu kılavuz, Campus Management System'in tüm özelliklerini ve kullanımını açıklar.

---

## 📋 İçindekiler

1. [Öğrenci Kılavuzu](#öğrenci-kılavuzu)
2. [Akademisyen Kılavuzu](#akademisyen-kılavuzu)
3. [Admin Kılavuzu](#admin-kılavuzu)
4. [Ortak Özellikler](#ortak-özellikler)

---

## 🎓 Öğrenci Kılavuzu

### 1. Kayıt ve Giriş

#### Kayıt Olma
1. Ana sayfada **"Register"** linkine tıklayın
2. Formu doldurun:
   - Full Name, Email, Password
   - User Type: **Student** seçin
   - Student Number girin
   - Department seçin
3. Email doğrulama linkine tıklayın
4. Giriş yapın

#### Giriş Yapma
1. Email ve şifrenizi girin
2. 2FA aktifse authenticator kodunu girin
3. Dashboard'a yönlendirilirsiniz

### 2. Ders İşlemleri

#### Ders Kataloğunu Görüntüleme
1. **"Dersler"** menüsünden **"Ders Kataloğu"** seçin
2. Dersleri filtreleyin (dönem, bölüm, kredi)
3. Ders detaylarını görüntüleyin

#### Ders Kaydı
1. Ders detay sayfasında **"Kayıt Ol"** butonuna tıklayın
2. Sistem kontrol eder:
   - Ön koşul kontrolü
   - Çakışma kontrolü
   - Kapasite kontrolü
3. Başarılı kayıt sonrası **"Derslerim"** sayfasında görünür

#### Ders Bırakma
1. **"Derslerim"** sayfasına gidin
2. Bırakmak istediğiniz dersin yanındaki **"Bırak"** butonuna tıklayın
3. Onaylayın

### 3. Notlar ve Transkript

#### Notları Görüntüleme
1. **"Notlarım"** sayfasına gidin
2. Ders bazlı notlarınızı görüntüleyin
3. GPA ve CGPA bilgilerinizi kontrol edin

#### Transkript İndirme
1. **"Notlarım"** sayfasında **"Transkript İndir"** butonuna tıklayın
2. PDF veya JSON formatında indirin

### 4. Yoklama

#### Yoklama Verme
1. **"Yoklama"** menüsünden **"Yoklama Ver"** seçin
2. Aktif yoklama oturumlarını görüntüleyin
3. **"Yoklama Ver"** butonuna tıklayın
4. GPS konumunuz kontrol edilir
5. Başarılı yoklama mesajı görünür

#### Yoklama Durumumu Görüntüleme
1. **"Yoklamalarım"** sayfasına gidin
2. Ders bazlı yoklama durumunuzu görüntüleyin
3. Devamsızlık yüzdenizi kontrol edin

#### Mazeret Talebi
1. **"Mazeret Talepleri"** sayfasına gidin
2. **"Yeni Talep"** butonuna tıklayın
3. Formu doldurun:
   - Ders seçin
   - Tarih seçin
   - Açıklama yazın
   - Belge yükleyin (opsiyonel)
4. Gönderin

### 5. Yemek Rezervasyonu

#### Menüyü Görüntüleme
1. **"Yemek"** menüsünden **"Menü"** seçin
2. Günlük menüyü görüntüleyin
3. Yemek detaylarını inceleyin

#### Rezervasyon Yapma
1. Menü sayfasında **"Rezervasyon Yap"** butonuna tıklayın
2. Tarih ve yemek seçin
3. Cüzdan bakiyenizi kontrol edin
4. Rezervasyonu onaylayın

#### Rezervasyonlarımı Görüntüleme
1. **"Rezervasyonlarım"** sayfasına gidin
2. Aktif ve geçmiş rezervasyonlarınızı görüntüleyin
3. İptal edebilirsiniz (belirli süre içinde)

#### QR Kod ile Kullanım
1. Yemekhane girişinde QR kodunuzu gösterin
2. Personel tarafından taranır
3. Kullanım onaylanır

### 6. Cüzdan

#### Bakiye Görüntüleme
1. **"Cüzdan"** sayfasına gidin
2. Mevcut bakiyenizi görüntüleyin
3. İşlem geçmişinizi inceleyin

#### Para Yükleme
1. **"Para Yükle"** butonuna tıklayın
2. Tutar girin
3. Ödeme sayfasına yönlendirilirsiniz
4. Ödeme tamamlandıktan sonra bakiye güncellenir

### 7. Etkinlikler

#### Etkinlikleri Görüntüleme
1. **"Etkinlikler"** menüsünden **"Tüm Etkinlikler"** seçin
2. Etkinlikleri filtreleyin (kategori, tarih)
3. Etkinlik detaylarını görüntüleyin

#### Etkinlik Kaydı
1. Etkinlik detay sayfasında **"Kayıt Ol"** butonuna tıklayın
2. Onaylayın
3. Kayıt durumunuzu **"Etkinliklerim"** sayfasından takip edin

#### Check-in
1. Etkinlik günü **"Etkinliklerim"** sayfasına gidin
2. Etkinliğin yanındaki **"Check-in"** butonuna tıklayın
3. QR kod gösterin veya manuel check-in yapın

### 8. Ders Programı

#### Programımı Görüntüleme
1. **"Programım"** sayfasına gidin
2. Haftalık ders programınızı görüntüleyin
3. Ders saatleri ve sınıfları kontrol edin

---

## 👨‍🏫 Akademisyen Kılavuzu

### 1. Ders Yönetimi

#### Derslerimi Görüntüleme
1. **"Derslerim"** sayfasına gidin
2. Size atanan dersleri görüntüleyin
3. Öğrenci listesini görüntüleyin

### 2. Not Girişi

#### Not Girişi
1. **"Not Defteri"** sayfasına gidin
2. Ders seçin
3. Öğrenci listesini görüntüleyin
4. Her öğrenci için not girin:
   - Vize notu
   - Final notu
   - Proje notu (varsa)
5. **"Kaydet"** butonuna tıklayın
6. Sistem otomatik olarak harf notu ve GPA hesaplar

### 3. Yoklama Yönetimi

#### Yoklama Oturumu Başlatma
1. **"Yoklama"** menüsünden **"Yoklama Başlat"** seçin
2. Ders ve şube seçin
3. GPS koordinatlarınızı alın
4. **"Oturum Başlat"** butonuna tıklayın
5. QR kod oluşturulur (yedek olarak)

#### Yoklama Oturumunu Kapatma
1. Aktif oturumlar listesinden oturumu seçin
2. **"Kapat"** butonuna tıklayın
3. Oturum kapatılır ve yoklama kayıtları kaydedilir

#### Yoklama Raporu
1. **"Yoklama Raporları"** sayfasına gidin
2. Ders ve şube seçin
3. Raporu görüntüleyin:
   - Öğrenci bazlı yoklama durumu
   - Devamsızlık yüzdeleri
   - Risk altındaki öğrenciler
4. Excel olarak export edebilirsiniz

#### Mazeret Onaylama
1. **"Mazeret Talepleri"** sayfasına gidin
2. Bekleyen talepleri görüntüleyin
3. Talebi inceleyin
4. **"Onayla"** veya **"Reddet"** butonuna tıklayın
5. Açıklama ekleyebilirsiniz

---

## 👨‍💼 Admin Kılavuzu

### 1. Dashboard

#### Genel Bakış
1. **"Admin Dashboard"** sayfasına gidin
2. Sistem metriklerini görüntüleyin:
   - Toplam kullanıcı sayısı
   - Aktif ders sayısı
   - Yoklama kayıtları
   - Yemek rezervasyonları

### 2. Kullanıcı Yönetimi

#### Kullanıcıları Görüntüleme
1. **"Kullanıcılar"** sayfasına gidin
2. Kullanıcıları filtreleyin (rol, durum)
3. Kullanıcı detaylarını görüntüleyin

#### Kullanıcı Oluşturma
1. **"Yeni Kullanıcı"** butonuna tıklayın
2. Formu doldurun
3. Kaydedin

### 3. Ders Yönetimi

#### Ders Oluşturma
1. **"Dersler"** menüsünden **"Yeni Ders"** seçin
2. Formu doldurun:
   - Ders kodu ve adı
   - Kredi
   - Bölüm
   - Ön koşullar (varsa)
3. Kaydedin

#### Ders Atama
1. **"Ders Atama"** sayfasına gidin
2. Ders ve şube seçin
3. Akademisyen seçin
4. Atayın

### 4. Analytics

#### Akademik Performans
1. **"Analytics"** menüsünden **"Akademik Performans"** seçin
2. Metrikleri görüntüleyin:
   - GPA analizi
   - Not dağılımı
   - Başarılı öğrenciler
   - Risk altındaki öğrenciler
3. Excel olarak export edin

#### Yoklama Analizi
1. **"Yoklama Analizi"** sayfasına gidin
2. Ders bazlı yoklama oranlarını görüntüleyin
3. Trend analizini inceleyin

#### Yemek Analizi
1. **"Yemek Analizi"** sayfasına gidin
2. Günlük kullanım verilerini görüntüleyin
3. Peak hours'ı analiz edin

#### Etkinlik Analizi
1. **"Etkinlik Analizi"** sayfasına gidin
2. Popüler etkinlikleri görüntüleyin
3. Katılım oranlarını analiz edin

### 5. IoT Dashboard (Bonus)

#### Sensör Yönetimi
1. **"IoT Dashboard"** sayfasına gidin
2. Sensörleri görüntüleyin
3. Yeni sensör ekleyin
4. Sensör verilerini görüntüleyin

---

## 🔐 Ortak Özellikler

### 1. Profil Yönetimi

#### Profili Görüntüleme
1. **"Profil"** sayfasına gidin
2. Kişisel bilgilerinizi görüntüleyin

#### Profili Güncelleme
1. **"Düzenle"** butonuna tıklayın
2. Bilgileri güncelleyin
3. Kaydedin

#### Profil Fotoğrafı Yükleme
1. Profil sayfasında **"Fotoğraf Yükle"** butonuna tıklayın
2. Dosya seçin (max 5MB, JPG/PNG)
3. Yükleyin

### 2. Two-Factor Authentication (2FA)

#### 2FA Aktif Etme
1. Profil sayfasında **"2FA Ayarları"** seçin
2. **"2FA Aktif Et"** butonuna tıklayın
3. QR kodu authenticator app'inize ekleyin
4. 6 haneli kodu girin
5. Onaylayın

#### 2FA Devre Dışı Bırakma
1. 2FA ayarları sayfasına gidin
2. **"2FA Devre Dışı Bırak"** butonuna tıklayın
3. Onaylayın

### 3. Bildirimler

#### Bildirimleri Görüntüleme
1. Sağ üstteki bildirim ikonuna tıklayın
2. Bildirimleri görüntüleyin
3. Okundu işaretleyin

#### Bildirim Ayarları
1. **"Ayarlar"** menüsünden **"Bildirimler"** seçin
2. Bildirim tercihlerinizi ayarlayın:
   - Email bildirimleri
   - Push bildirimleri
   - SMS bildirimleri
   - Kategori bazlı tercihler

### 4. Şifre Değiştirme

#### Şifre Sıfırlama
1. Login sayfasında **"Şifremi Unuttum"** linkine tıklayın
2. Email adresinizi girin
3. Email'inize gelen linke tıklayın
4. Yeni şifre belirleyin

---

## 📱 Mobil Uyumluluk

Sistem responsive tasarıma sahiptir ve mobil cihazlarda da kullanılabilir:
- Telefon ve tablet uyumlu
- Touch-friendly arayüz
- Mobil optimizasyonlu formlar

---

## ❓ Sık Sorulan Sorular (FAQ)

### Genel Sorular

**S: Şifremi unuttum, ne yapmalıyım?**  
C: Login sayfasında "Şifremi Unuttum" linkine tıklayın ve email adresinize gelen linki takip edin.

**S: Email doğrulama linki gelmedi.**  
C: Spam klasörünüzü kontrol edin. Hala gelmediyse, kayıt işlemini tekrar deneyin.

**S: Ders kaydı yapamıyorum.**  
C: Ön koşul kontrolü, çakışma kontrolü veya kapasite kontrolü başarısız olabilir. Hata mesajını kontrol edin.

### Yoklama Soruları

**S: GPS yoklama çalışmıyor.**  
C: Tarayıcınızın konum izni verdiğinden emin olun. Alternatif olarak QR kod kullanabilirsiniz.

**S: Yoklama veremiyorum.**  
C: Yoklama oturumunun aktif olduğundan ve doğru konumda olduğunuzdan emin olun.

### Yemek Rezervasyonu Soruları

**S: Rezervasyon iptal edebilir miyim?**  
C: Evet, belirli süre içinde rezervasyonlarınızı iptal edebilirsiniz.

**S: Cüzdan bakiyem yetersiz.**  
C: Cüzdan sayfasından para yükleyebilirsiniz.

---

## 📞 Destek

Sorun yaşarsanız:
- **Email:** support@campus.edu.tr
- **Telefon:** +90 XXX XXX XX XX
- **Çalışma Saatleri:** Pazartesi-Cuma, 09:00-17:00

---

**Son Güncelleme:** 28 Aralık 2025






