\# Grup 7 - API Dokümantasyonu (Part 2)



Akademik yönetim sistemi için geliştirilen temel API uç noktaları aşağıdadır:



\## 1. Yoklama Sistemi (Attendance)

\- `POST /api/attendance/start`: Yeni bir yoklama oturumu başlatır (QR kod üretir).

\- `POST /api/attendance/verify`: Öğrencinin konumu ve QR kodu ile yoklamasını onaylar.

\- `GET /api/attendance/report/:courseId`: İlgili dersin yoklama raporunu getirir.



\## 2. Not Sistemi (Grades)

\- `POST /api/grades/assign`: Öğretim üyesi tarafından öğrenciye not girişi yapılır.

\- `GET /api/grades/student/:studentId`: Öğrencinin tüm not geçmişini listeler.



\## 3. Kullanıcı Yönetimi

\- `POST /api/auth/refresh`: Oturumu kapatmadan token yenileme işlemini yapar.

