# .env Dosyası Kontrolü

Backend `.env` dosyasında şu ayarlar olmalı:

```env
DATABASE_URL=postgresql://admin:password@localhost:5432/campus_db
JWT_SECRET=your-secret-key-here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Önemli:** Container'da kullanıcı adı `admin` ve şifre `password` olarak ayarlanmış.

## Migration Durumu

✅ Migration başarıyla uygulandı
✅ Tüm tablolar oluşturuldu:
- notifications
- notification_preferences  
- sensors
- sensor_data

✅ Veriler korundu

## Sonraki Adımlar

1. Backend'i başlatın:
```powershell
npm start
```

2. Frontend'i başlatın:
```powershell
cd ../Grup7_WebProje_Frontend
npm start
```

3. Test edin:
- Backend: http://localhost:5000/api/v1/health
- Frontend: http://localhost:3000

