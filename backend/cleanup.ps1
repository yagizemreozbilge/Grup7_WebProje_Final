# Backend Dosya Temizleme Scripti
# Bu script gereksiz klasör ve dosyaları siler

Write-Host "Backend temizleme başlatılıyor..." -ForegroundColor Green

# Gereksiz klasörleri sil
$foldersToDelete = @(
    "models",
    "config",
    "src\views",
    "src\public"
)

foreach ($folder in $foldersToDelete) {
    if (Test-Path $folder) {
        Write-Host "Siliniyor: $folder" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $folder -ErrorAction SilentlyContinue
        if (-not (Test-Path $folder)) {
            Write-Host "  ✓ Silindi: $folder" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Silinemedi: $folder (dosya kullanımda olabilir)" -ForegroundColor Red
        }
    } else {
        Write-Host "  - Zaten yok: $folder" -ForegroundColor Gray
    }
}

# Gereksiz dosyaları sil
$filesToDelete = @(
    "src\package.json",
    "src\package-lock.json"
)

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Write-Host "Siliniyor: $file" -ForegroundColor Yellow
        Remove-Item -Force $file -ErrorAction SilentlyContinue
        if (-not (Test-Path $file)) {
            Write-Host "  ✓ Silindi: $file" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Silinemedi: $file (dosya kullanımda olabilir)" -ForegroundColor Red
        }
    } else {
        Write-Host "  - Zaten yok: $file" -ForegroundColor Gray
    }
}

Write-Host "`nTemizleme tamamlandı!" -ForegroundColor Green
Write-Host "Eğer bazı dosyalar silinemediyse, lütfen IDE'yi kapatıp tekrar deneyin." -ForegroundColor Yellow

