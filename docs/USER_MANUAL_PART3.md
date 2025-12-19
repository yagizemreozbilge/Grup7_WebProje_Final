# Kullanıcı Kılavuzu - Part 3

Bu kılavuz, Part 3 modüllerinin (Yemek Servisi, Etkinlik Yönetimi, Ders Programı) kullanımını açıklar.

## İçindekiler

1. [Yemek Rezervasyon Sistemi](#yemek-rezervasyon-sistemi)
2. [Cüzdan ve Ödeme](#cüzdan-ve-ödeme)
3. [Etkinlik Yönetimi](#etkinlik-yönetimi)
4. [Ders Programı](#ders-programı)
5. [Derslik Rezervasyonu](#derslik-rezervasyonu)

---

## Yemek Rezervasyon Sistemi

### Menü Görüntüleme

1. Ana menüden **"Yemekler"** sekmesine tıklayın
2. Tarih seçerek o günün menüsünü görüntüleyebilirsiniz
3. Her menüde şu bilgiler görünür:
   - Ana yemek
   - Yan yemek
   - Salata
   - Tatlı
   - Kalori ve besin değerleri

### Yemek Rezervasyonu Yapma

1. **Menü sayfasında** rezerve etmek istediğiniz öğünü seçin (öğle/akşam)
2. **"Rezerve Et"** butonuna tıklayın
3. Rezervasyon onay penceresinde detayları kontrol edin
4. **"Onayla"** butonuna tıklayın

**Notlar:**
- Burslu öğrenciler günde maksimum 2 öğün rezerve edebilir
- Ücretli öğrenciler için cüzdan bakiyesi kontrol edilir
- Rezervasyon başarılı olduğunda QR kod oluşturulur

### Rezervasyonlarımı Görüntüleme

1. **"Rezervasyonlarım"** sayfasına gidin
2. Gelecek ve geçmiş rezervasyonlarınızı görüntüleyin
3. Her rezervasyon için:
   - Tarih ve öğün bilgisi
   - QR kod (yaklaşan rezervasyonlar için)
   - Durum (rezerve edildi, kullanıldı, iptal edildi)

### QR Kod ile Yemek Kullanımı

1. Yemekhaneye gittiğinizde QR kodunuzu gösterin
2. Yemekhane personeli QR kodu okutur
3. Sistem otomatik olarak rezervasyonu "kullanıldı" olarak işaretler

**QR Kod Görüntüleme:**
- Rezervasyonlarım sayfasında QR kodun üzerine tıklayın
- Tam ekran QR kod görüntülenir
- Telefonunuzla ekran görüntüsü alabilir veya yazdırabilirsiniz

### Rezervasyon İptali

1. **"Rezervasyonlarım"** sayfasına gidin
2. İptal etmek istediğiniz rezervasyonu bulun
3. **"İptal Et"** butonuna tıklayın
4. İptal onayı verin

**Önemli:**
- Rezervasyon en az 2 saat önceden iptal edilmelidir
- Ücretli öğrenciler için iptal edilen rezervasyon tutarı cüzdana iade edilir

---

## Cüzdan ve Ödeme

### Cüzdan Bakiyesini Görüntüleme

1. Ana menüden **"Cüzdan"** sekmesine tıklayın
2. Mevcut bakiyenizi görüntüleyin
3. İşlem geçmişinizi inceleyin

### Para Yükleme

1. **"Cüzdan"** sayfasında **"Para Yükle"** butonuna tıklayın
2. Yüklemek istediğiniz tutarı girin (minimum 50 TRY)
3. Ödeme yöntemini seçin
4. **"Ödemeye Geç"** butonuna tıklayın
5. Ödeme sayfasına yönlendirilirsiniz
6. Ödeme bilgilerinizi girin ve tamamlayın

**Not:** Şu anda test modunda çalışmaktadır. Gerçek ödeme gateway entegrasyonu production'da aktif olacaktır.

### İşlem Geçmişi

1. **"Cüzdan"** sayfasında **"İşlem Geçmişi"** sekmesine tıklayın
2. Tüm işlemlerinizi görüntüleyin:
   - Para yükleme (credit)
   - Yemek ödemeleri (debit)
   - İptal iadeleri (credit)
3. Her işlem için:
   - Tarih ve saat
   - İşlem tipi
   - Tutar
   - İşlem sonrası bakiye
   - Açıklama

---

## Etkinlik Yönetimi

### Etkinlik Listesini Görüntüleme

1. Ana menüden **"Etkinlikler"** sekmesine tıklayın
2. Tüm yaklaşan etkinlikleri görüntüleyin
3. Filtreleme seçenekleri:
   - Kategori (konferans, workshop, sosyal, spor)
   - Tarih aralığı
   - Durum (yaklaşan, devam eden, geçmiş)

### Etkinlik Detaylarını Görüntüleme

1. Etkinlik listesinde bir etkinliğe tıklayın
2. Detay sayfasında şu bilgileri görün:
   - Etkinlik başlığı ve açıklaması
   - Tarih ve saat
   - Konum
   - Kapasite ve kalan yer sayısı
   - Kayıt son tarihi
   - Ücret bilgisi (varsa)

### Etkinliğe Kayıt Olma

1. Etkinlik detay sayfasında **"Kayıt Ol"** butonuna tıklayın
2. Gerekli bilgileri doldurun (varsa özel alanlar)
3. **"Kaydı Tamamla"** butonuna tıklayın
4. Kayıt başarılı olduğunda QR kodunuz oluşturulur

**Notlar:**
- Kapasite dolduğunda kayıt yapılamaz
- Kayıt son tarihi geçmişse kayıt yapılamaz
- Ücretli etkinlikler için cüzdan bakiyesi kontrol edilir

### Kayıtlarımı Görüntüleme

1. **"Etkinliklerim"** sayfasına gidin
2. Kayıt olduğunuz etkinlikleri görüntüleyin
3. Her etkinlik için:
   - Etkinlik bilgileri
   - QR kod (yaklaşan etkinlikler için)
   - Giriş durumu (giriş yapıldı/yapılmadı)

### Etkinlik Kaydını İptal Etme

1. **"Etkinliklerim"** sayfasına gidin
2. İptal etmek istediğiniz etkinliği bulun
3. **"Kaydı İptal Et"** butonuna tıklayın
4. İptal onayı verin

**Not:** Ücretli etkinlikler için iptal durumunda ücret iade edilir.

### QR Kod ile Etkinlik Girişi

1. Etkinlik girişinde QR kodunuzu gösterin
2. Etkinlik yöneticisi QR kodu okutur
3. Sistem otomatik olarak girişinizi işaretler

---

## Ders Programı

### Kişisel Ders Programını Görüntüleme

1. Ana menüden **"Ders Programım"** sekmesine tıklayın
2. Haftalık takvim görünümünde derslerinizi görüntüleyin
3. Her ders için:
   - Ders kodu ve adı
   - Öğretim üyesi
   - Derslik
   - Saat aralığı

### Ders Programını iCal Formatında İndirme

1. **"Ders Programım"** sayfasında **"iCal İndir"** butonuna tıklayın
2. `.ics` dosyası indirilir
3. Bu dosyayı Google Calendar, Outlook veya Apple Calendar'a import edebilirsiniz

**Kullanım:**
- **Google Calendar**: Sol menüden "Import" > Dosya seç > Import
- **Outlook**: File > Open & Export > Import/Export > Import iCalendar
- **Apple Calendar**: File > Import > Dosya seç

### Otomatik Program Oluşturma (Admin)

1. Admin panelinden **"Program Oluştur"** sayfasına gidin
2. Dönem ve yıl bilgilerini girin
3. Program oluşturulacak section'ları seçin
4. **"Program Oluştur"** butonuna tıklayın
5. Sistem otomatik olarak en uygun programı oluşturur
6. Oluşturulan programı önizleyin
7. **"Kaydet ve Yayınla"** butonuna tıklayın

**Not:** Program oluşturma işlemi birkaç dakika sürebilir.

---

## Derslik Rezervasyonu

### Derslik Rezerve Etme

1. Ana menüden **"Derslik Rezervasyonu"** sekmesine tıklayın
2. Mevcut derslikleri görüntüleyin
3. Filtreleme seçenekleri:
   - Bina
   - Kapasite
   - Özellikler (projeksiyon, laboratuvar, vb.)
4. Rezerve etmek istediğiniz dersliği seçin
5. Tarih ve saat aralığını belirleyin
6. Rezervasyon amacını girin
7. **"Rezerve Et"** butonuna tıklayın

**Not:** Rezervasyon admin onayından sonra aktif olur.

### Rezervasyon Durumunu Kontrol Etme

1. **"Rezervasyonlarım"** sayfasına gidin
2. Derslik rezervasyonlarınızı görüntüleyin
3. Durum bilgisi:
   - **Beklemede**: Admin onayı bekleniyor
   - **Onaylandı**: Rezervasyon aktif
   - **Reddedildi**: Rezervasyon reddedildi (sebep görüntülenir)

### Rezervasyon İptali

1. **"Rezervasyonlarım"** sayfasına gidin
2. İptal etmek istediğiniz rezervasyonu bulun
3. **"İptal Et"** butonuna tıklayın
4. İptal onayı verin

---

## Sık Sorulan Sorular (FAQ)

### Yemek Rezervasyonu

**S: Burslu öğrenciyim, günde kaç öğün rezerve edebilirim?**
C: Burslu öğrenciler günde maksimum 2 öğün rezerve edebilir.

**S: Rezervasyonumu ne zaman iptal edebilirim?**
C: Rezervasyon en az 2 saat önceden iptal edilmelidir.

**S: QR kodumu kaybettim, ne yapmalıyım?**
C: Rezervasyonlarım sayfasından QR kodunuzu tekrar görüntüleyebilirsiniz.

### Cüzdan

**S: Minimum ne kadar para yükleyebilirim?**
C: Minimum 50 TRY yükleyebilirsiniz.

**S: Para yükleme işlemi ne kadar sürer?**
C: Ödeme tamamlandıktan sonra bakiye anında güncellenir.

**S: İptal edilen rezervasyonlar için iade ne zaman gelir?**
C: İptal işlemi sonrası iade anında cüzdanınıza eklenir.

### Etkinlikler

**S: Etkinlik kapasitesi dolduğunda ne olur?**
C: Kapasite dolduğunda kayıt yapılamaz. Bekleme listesine eklenebilirsiniz (bonus özellik).

**S: Etkinlik kaydımı iptal edebilir miyim?**
C: Evet, etkinlik başlamadan önce kaydınızı iptal edebilirsiniz.

**S: QR kodumu ne zaman kullanmalıyım?**
C: Etkinlik girişinde QR kodunuzu gösterin, personel okutacaktır.

### Ders Programı

**S: Ders programım neden görünmüyor?**
C: Admin tarafından program oluşturulmamış olabilir. Lütfen admin ile iletişime geçin.

**S: iCal dosyasını nasıl kullanırım?**
C: İndirdiğiniz `.ics` dosyasını Google Calendar, Outlook veya Apple Calendar'a import edebilirsiniz.

### Derslik Rezervasyonu

**S: Rezervasyonum ne zaman onaylanır?**
C: Admin tarafından incelendikten sonra onaylanır veya reddedilir. Genellikle 24 saat içinde sonuçlanır.

**S: Rezervasyonum reddedildi, sebebini görebilir miyim?**
C: Evet, rezervasyonlarım sayfasında reddetme sebebi görüntülenir.

---

## Ekran Görüntüleri

### Yemek Menüsü
![Yemek Menüsü](screenshots/meal_menu.png)

### Rezervasyonlarım
![Rezervasyonlarım](screenshots/my_reservations.png)

### Cüzdan
![Cüzdan](screenshots/wallet.png)

### Etkinlikler
![Etkinlikler](screenshots/events.png)

### Ders Programı
![Ders Programı](screenshots/schedule.png)

---

## Destek

Sorularınız için:
- Email: support@campus.edu.tr
- İç sistem: Yardım masası
- Dokümantasyon: `/docs` klasörü

