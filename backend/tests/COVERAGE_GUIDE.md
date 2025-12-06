# Test Coverage Raporu Nasıl Görüntülenir?

## 1. Terminal'de Coverage Raporu

### Coverage raporunu çalıştır:
```bash
cd backend
npm run test:coverage
```

Bu komut:
- Tüm testleri çalıştırır
- Coverage raporunu terminal'de gösterir
- `coverage/` klasöründe detaylı HTML raporu oluşturur

### Terminal çıktısı örneği:
```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   85.23 |    78.45 |   82.10 |   85.23 |
 src/services      |   90.12 |    85.67 |   88.90 |   90.12 |
  authService.js   |   92.34 |    88.90 |   91.23 |   92.34 |
  userService.js   |   87.90 |    82.45 |   86.57 |   87.90 |
 src/controllers   |   88.45 |    82.34 |   86.78 |   88.45 |
  authController.js |   89.12 |    83.45 |   87.34 |   89.12 |
  userController.js|   87.78 |    81.23 |   86.22 |   87.78 |
-------------------|---------|----------|---------|---------|-------------------
```

## 2. HTML Raporu (Detaylı)

Coverage raporu çalıştıktan sonra:

1. `backend/coverage/` klasörüne gidin
2. `index.html` dosyasını tarayıcıda açın:
   ```bash
   # Windows
   start coverage/index.html
   
   # Mac
   open coverage/index.html
   
   # Linux
   xdg-open coverage/index.html
   ```

### HTML raporunda görebileceğiniz:
- ✅ Her dosya için coverage yüzdesi
- ✅ Hangi satırların test edildiği (yeşil)
- ✅ Hangi satırların test edilmediği (kırmızı)
- ✅ Branch coverage (if/else dalları)
- ✅ Function coverage
- ✅ Line coverage

## 3. Coverage Metrikleri Açıklaması

### % Stmts (Statements)
- Kodunuzdaki tüm ifadelerin (statements) yüzde kaçının test edildiği

### % Branch
- If/else, switch gibi dallanma noktalarının yüzde kaçının test edildiği

### % Funcs (Functions)
- Fonksiyonların yüzde kaçının test edildiği

### % Lines
- Satırların yüzde kaçının test edildiği

## 4. Coverage Klasör Yapısı

```
backend/
└── coverage/
    ├── index.html          # Ana rapor (BURAYA BAK!)
    ├── lcov-report/        # LCOV format raporu
    │   └── index.html
    └── coverage-final.json # JSON format raporu
```

## 5. Coverage Hedefleri

İyi bir coverage için:
- **Minimum**: %70
- **İyi**: %80-85
- **Mükemmel**: %90+

## 6. Coverage'ı Artırma

Eğer coverage düşükse:

1. **HTML raporunu açın** (`coverage/index.html`)
2. **Kırmızı satırları** (test edilmemiş) kontrol edin
3. **Eksik test senaryolarını** ekleyin:
   - Edge cases
   - Error handling
   - Boundary conditions

## 7. Örnek Kullanım

```bash
# 1. Coverage raporunu oluştur
cd backend
npm run test:coverage

# 2. HTML raporunu aç
# Windows PowerShell:
Start-Process coverage/index.html

# Windows CMD:
start coverage/index.html

# Mac/Linux:
open coverage/index.html
# veya
xdg-open coverage/index.html
```

## 8. CI/CD'de Coverage

Coverage raporunu CI/CD pipeline'ında da kullanabilirsiniz:

```yaml
# .github/workflows/test.yml örneği
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Notlar

- Coverage raporu her çalıştırmada yeniden oluşturulur
- `coverage/` klasörü `.gitignore`'da olmalı (git'e commit edilmemeli)
- Coverage raporu sadece test edilen dosyaları gösterir
- `node_modules/` ve `tests/` klasörleri coverage'a dahil edilmez

