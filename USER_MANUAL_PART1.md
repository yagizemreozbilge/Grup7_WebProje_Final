# User Manual - Part 1

## Campus Management System Kullanım Kılavuzu

Bu doküman, Campus Management System'in temel özelliklerini ve kullanımını açıklar.

---

## İçindekiler

1. [Kayıt Olma](#1-kayıt-olma)
2. [Email Doğrulama](#2-email-doğrulama)
3. [Giriş Yapma](#3-giriş-yapma)
4. [Profil Görüntüleme ve Güncelleme](#4-profil-görüntüleme-ve-güncelleme)
5. [Profil Fotoğrafı Yükleme](#5-profil-fotoğrafı-yükleme)
6. [Şifre Sıfırlama](#6-şifre-sıfırlama)

---

## 1. Kayıt Olma

### Adımlar:

1. Ana sayfada **"Register"** veya **"Register here"** linkine tıklayın.

2. Kayıt formunu doldurun:
   - **Full Name**: Adınız ve soyadınız
   - **Email**: Geçerli bir email adresi
   - **Password**: En az 8 karakter, büyük harf, küçük harf ve rakam içermeli
   - **Confirm Password**: Şifrenizi tekrar girin
   - **User Type**: Student veya Faculty seçin
   - **Student Number** (öğrenci ise): Öğrenci numaranız
   - **Employee Number** (öğretim üyesi ise): Personel numaranız
   - **Title** (öğretim üyesi ise): Unvanınız (Prof., Doç. Dr., vb.)
   - **Department**: Bölümünüzü seçin

3. **"Register"** butonuna tıklayın.

4. Başarılı kayıt sonrası email adresinize doğrulama linki gönderilecektir.

### Ekran Görüntüsü:
```
┌─────────────────────────────────┐
│         Register                │
├─────────────────────────────────┤
│ Full Name: [____________]       │
│ Email: [____________]           │
│ Password: [____________]        │
│ Confirm Password: [____________]│
│ User Type: [Student ▼]         │
│ Student Number: [____________]  │
│ Department: [Select ▼]         │
│                                 │
│        [Register]               │
│                                 │
│ Already have an account?       │
│ Login here                      │
└─────────────────────────────────┘
```

---

## 2. Email Doğrulama

### Adımlar:

1. Kayıt sonrası email adresinize gelen doğrulama linkine tıklayın.

2. Veya email'deki linki tarayıcınıza kopyalayıp yapıştırın.

3. Doğrulama sayfasında:
   - **Başarılı**: "Email verified successfully!" mesajı görünecek ve 3 saniye sonra login sayfasına yönlendirileceksiniz.
   - **Hata**: "Verification failed" mesajı görünecek. Link süresi dolmuş olabilir.

4. Doğrulama tamamlandıktan sonra giriş yapabilirsiniz.

---

## 3. Giriş Yapma

### Adımlar:

1. Ana sayfada **"Login"** linkine tıklayın veya doğrudan `/login` adresine gidin.

2. Login formunu doldurun:
   - **Email**: Kayıt olduğunuz email adresi
   - **Password**: Şifreniz

3. **"Login"** butonuna tıklayın.

4. Başarılı giriş sonrası Dashboard sayfasına yönlendirileceksiniz.

### Ekran Görüntüsü:
```
┌─────────────────────────────────┐
│           Login                 │
├─────────────────────────────────┤
│ Email: [____________]           │
│ Password: [____________]        │
│                                 │
│ Forgot password?                │
│                                 │
│        [Login]                  │
│                                 │
│ Don't have an account?         │
│ Register here                    │
└─────────────────────────────────┘
```

---

## 4. Profil Görüntüleme ve Güncelleme

### Profil Görüntüleme:

1. Giriş yaptıktan sonra sol menüden **"Profile"** linkine tıklayın.

2. Profil sayfasında şu bilgileri görebilirsiniz:
   - Email (değiştirilemez)
   - Full Name
   - Phone
   - Role
   - Student Number (öğrenci ise)
   - Employee Number (öğretim üyesi ise)

### Profil Güncelleme:

1. Profil sayfasında **"Full Name"** ve **"Phone"** alanlarını düzenleyin.

2. **"Save Changes"** butonuna tıklayın.

3. Başarılı güncelleme sonrası "Profile updated successfully!" mesajı görünecektir.

---

## 5. Profil Fotoğrafı Yükleme

### Adımlar:

1. Profil sayfasında profil fotoğrafı bölümüne gidin.

2. **"Upload Picture"** butonuna tıklayın.

3. Bilgisayarınızdan bir resim seçin:
   - **Format**: JPG, JPEG veya PNG
   - **Maksimum Boyut**: 5MB

4. Dosya seçildikten sonra otomatik olarak yüklenecektir.

5. Başarılı yükleme sonrası "Profile picture uploaded successfully!" mesajı görünecek ve yeni fotoğrafınız görüntülenecektir.

### Ekran Görüntüsü:
```
┌─────────────────────────────────┐
│         Profile                 │
├─────────────────────────────────┤
│ Profile Picture                 │
│  [Fotoğraf]  [Upload Picture]   │
│                                 │
│ Personal Information            │
│ Email: [student@example.com]    │
│ Full Name: [John Doe]           │
│ Phone: [+905551234567]          │
│                                 │
│        [Save Changes]           │
└─────────────────────────────────┘
```

---

## 6. Şifre Sıfırlama

### Şifremi Unuttum:

1. Login sayfasında **"Forgot password?"** linkine tıklayın.

2. Email adresinizi girin.

3. **"Send Reset Link"** butonuna tıklayın.

4. Email adresinize şifre sıfırlama linki gönderilecektir.

### Şifre Sıfırlama:

1. Email'inizdeki şifre sıfırlama linkine tıklayın.

2. Yeni şifrenizi girin:
   - En az 8 karakter
   - Büyük harf, küçük harf ve rakam içermeli

3. Şifrenizi tekrar girin (Confirm Password).

4. **"Reset Password"** butonuna tıklayın.

5. Başarılı sıfırlama sonrası login sayfasına yönlendirileceksiniz.

---

## Dashboard

Giriş yaptıktan sonra Dashboard sayfasında:

- Hoş geldiniz mesajı (adınızla)
- Rolünüz (Student/Faculty/Admin)
- Öğrenci bilgileri (öğrenci ise): Öğrenci numarası, bölüm, GPA, CGPA
- Öğretim üyesi bilgileri (öğretim üyesi ise): Personel numarası, unvan, bölüm

---

## Sorun Giderme

### Email doğrulama linki çalışmıyor:
- Link'in süresi dolmuş olabilir (24 saat). Yeni bir kayıt oluşturun veya yöneticiye başvurun.

### Şifre sıfırlama linki çalışmıyor:
- Link'in süresi dolmuş olabilir (24 saat). Yeni bir şifre sıfırlama isteği gönderin.

### Profil fotoğrafı yüklenmiyor:
- Dosya boyutunun 5MB'dan küçük olduğundan emin olun.
- Dosya formatının JPG, JPEG veya PNG olduğundan emin olun.

### Giriş yapamıyorum:
- Email adresinizi doğruladığınızdan emin olun.
- Şifrenizin doğru olduğundan emin olun.
- "Forgot password?" linkini kullanarak şifrenizi sıfırlayın.

---

## Destek

Sorularınız için: mehmetsevri@gmail.com

