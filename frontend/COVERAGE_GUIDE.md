# Frontend Test Coverage Rehberi

## Coverage Raporlarını Görüntüleme

### 1. Coverage Raporu Oluşturma

Frontend klasöründe aşağıdaki komutu çalıştırın:

```bash
cd frontend
npm test -- --coverage --watchAll=false
```

veya package.json'a script ekleyerek:

```bash
npm run test:coverage
```

### 2. Coverage Raporlarının Konumu

Coverage raporları şu klasörlerde oluşturulur:

- **Terminal çıktısı**: Komut çalıştırıldığında terminal'de görünür
- **HTML raporu**: `frontend/coverage/lcov-report/index.html`
- **LCOV raporu**: `frontend/coverage/lcov.info`

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

### 4. Package.json Script Ekleme

`frontend/package.json` dosyasına şu script'i ekleyin:

```json
{
  "scripts": {
    "test:coverage": "react-scripts test --coverage --watchAll=false"
  }
}
```

### 5. Coverage Metrikleri

Coverage raporu şu metrikleri gösterir:

- **Statements**: Kod satırlarının yüzdesi
- **Branches**: If/else, switch gibi dallanmaların yüzdesi
- **Functions**: Fonksiyonların yüzdesi
- **Lines**: Satırların yüzdesi

### 6. Minimum Coverage Hedefleri

Proje gereksinimlerine göre:
- **Frontend**: Minimum %75 coverage
- **Branches**: Minimum %70
- **Functions**: Minimum %75
- **Lines**: Minimum %75

### 7. Coverage Raporunu Yorumlama

HTML raporunda:
- **Yeşil**: Test edilmiş kod
- **Kırmızı**: Test edilmemiş kod
- **Sarı**: Kısmen test edilmiş kod

Her dosyaya tıklayarak detaylı coverage bilgisi görebilirsiniz.

### 8. Coverage'ı Artırma

Coverage düşükse:
1. Test edilmemiş component'leri belirleyin
2. Eksik test senaryolarını ekleyin
3. User interaction testleri ekleyin
4. Edge case'leri test edin

### 9. Jest Coverage Yapılandırması

`package.json` içinde veya `jest.config.js` dosyasında coverage ayarları:

```json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,jsx}",
      "!src/index.js",
      "!src/reportWebVitals.js",
      "!src/setupTests.js"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 75,
        "lines": 75,
        "statements": 75
      }
    }
  }
}
```

## Örnek Terminal Çıktısı

```
PASS  src/pages/Login.test.js
PASS  src/pages/Register.test.js

-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   78.45 |    72.15 |   76.67 |   78.45 |
 src/pages         |   85.23 |    80.45 |   82.34 |   85.23 |
  Login.js         |   90.12 |    85.67 |   88.90 |   90.12 |
  Register.js      |   80.34 |    75.23 |   75.79 |   80.34 |
 src/components    |   75.67 |    70.12 |   73.45 |   75.67 |
  TextInput.js     |   88.90 |    85.67 |   87.89 |   88.90 |
  Select.js        |   82.34 |    78.23 |   80.56 |   82.34 |
-------------------|---------|----------|---------|---------|-------------------

Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        3.456 s
```
