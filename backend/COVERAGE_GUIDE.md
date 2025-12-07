# Test Coverage Rehberi

## Coverage Raporlarını Görüntüleme

### 1. Coverage Raporu Oluşturma

Backend klasöründe aşağıdaki komutu çalıştırın:

```bash
cd backend
npm run test:coverage
```

Bu komut:
- Tüm testleri çalıştırır
- Coverage raporunu oluşturur
- Terminal'de özet bilgi gösterir
- HTML raporu oluşturur

### 2. Coverage Raporlarının Konumu

Coverage raporları şu klasörlerde oluşturulur:

- **Terminal çıktısı**: Komut çalıştırıldığında terminal'de görünür
- **HTML raporu**: `backend/coverage/lcov-report/index.html`
- **LCOV raporu**: `backend/coverage/lcov.info`

### 3. HTML Raporunu Görüntüleme

#### Windows'ta:
```bash
# HTML dosyasını tarayıcıda aç
start coverage/lcov-report/index.html
```

#### Mac/Linux'ta:
```bash
# HTML dosyasını tarayıcıda aç
open coverage/lcov-report/index.html
# veya
xdg-open coverage/lcov-report/index.html
```

### 4. Coverage Metrikleri

Coverage raporu şu metrikleri gösterir:

- **Statements**: Kod satırlarının yüzdesi
- **Branches**: If/else, switch gibi dallanmaların yüzdesi
- **Functions**: Fonksiyonların yüzdesi
- **Lines**: Satırların yüzdesi

### 5. Minimum Coverage Hedefleri

Proje gereksinimlerine göre:
- **Backend**: Minimum %85 coverage
- **Branches**: Minimum %80
- **Functions**: Minimum %80
- **Lines**: Minimum %85

### 6. Coverage Raporunu Yorumlama

HTML raporunda:
- **Yeşil**: Test edilmiş kod
- **Kırmızı**: Test edilmemiş kod
- **Sarı**: Kısmen test edilmiş kod

Her dosyaya tıklayarak detaylı coverage bilgisi görebilirsiniz.

### 7. Coverage'ı Artırma

Coverage düşükse:
1. Test edilmemiş dosyaları belirleyin (kırmızı/sarı)
2. Eksik test senaryolarını ekleyin
3. Edge case'leri test edin
4. Error handling'i test edin

### 8. CI/CD'de Coverage

GitHub Actions gibi CI/CD sistemlerinde coverage raporu otomatik oluşturulabilir ve badge olarak gösterilebilir.

## Örnek Terminal Çıktısı

```
PASS  tests/unit/authService.test.js
PASS  tests/unit/userService.test.js
PASS  tests/integration/auth.test.js
PASS  tests/integration/users.test.js

-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   87.23 |    82.15 |   85.67 |   87.23 |
 src/services       |   92.45 |    88.90 |   90.12 |   92.45 |
  authService.js    |   95.67 |    92.34 |   94.56 |   95.67 |
  userService.js    |   89.23 |    85.46 |   85.68 |   89.23 |
 src/controllers    |   85.12 |    80.45 |   82.34 |   85.12 |
  authController.js |   88.90 |    85.67 |   87.89 |   88.90 |
  userController.js |   81.34 |    75.23 |   76.79 |   81.34 |
-------------------|---------|----------|---------|---------|-------------------

Test Suites: 4 passed, 4 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        5.234 s
```
