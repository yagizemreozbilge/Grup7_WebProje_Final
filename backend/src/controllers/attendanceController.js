// src/controllers/attendanceController.js
const attendanceService = require('../services/attendanceService');
const ExcelJS = require('exceljs');

exports.createSession = async (req, res) => {
  try {
    // Gerekli parametreleri assignment'a uygun al
    const { section_id, date, start_time, end_time, latitude, longitude } = req.body;
    if (!section_id || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'section_id, date, start_time ve end_time gereklidir.' });
    }
    // Yoklama oturumu oluştur
    const session = await attendanceService.createSession({
      section_id,
      instructor_id: req.user?.id,
      date,
      start_time,
      end_time,
      latitude,
      longitude
    });
    res.status(201).json(session);
  } catch (err) {
    console.error('Yoklama oturumu başlatılamadı HATASI:', err);
    res.status(500).json({ error: 'Yoklama oturumu başlatılamadı', details: err.message });
  }
};


exports.markAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    // Student tablosundan asil ID'yi bul
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) return res.status(404).json({ error: 'Öğrenci kaydı bulunamadı' });

    const { sessionId, latitude, longitude, accuracy } = req.body;
    if (!sessionId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Eksik parametreler (sessionId, lat, long)' });
    }

    const result = await attendanceService.checkAttendance({
      sessionId,
      studentId: student.id,
      latitude,
      longitude,
      accuracy
    });

    if (result.success) {
      res.status(201).json({ success: true, message: 'Yoklama başarılı', data: result });
    } else {
      // Flagged but recorded
      res.status(200).json({ success: true, message: 'Yoklama alındı (Şüpheli)', warning: 'Konum sınırı dışında', data: result });
    }

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    // Implementasyon: Öğrencinin bir dersteki devamsızlık durumu
    // Şimdilik basitçe stub kalabilir veya geliştirilebilir.
    res.json({ message: 'Yoklama durumu endpointi (stub)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const report = await attendanceService.getReport(sectionId);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Rapor alınamadı', details: err.message });
  }
};

exports.submitExcuse = async (req, res) => {
  try {
    const studentId = req.user?.id;
    const { sessionId, reason } = req.body;
    if (!studentId) return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
    if (!sessionId || !reason) return res.status(400).json({ error: 'Eksik parametre' });
    const result = await attendanceService.submitExcuse({ studentId, sessionId, reason });
    res.status(201).json({ success: true, excuse: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.markAttendanceQR = async (req, res) => {
  // ...QR kod ile yoklama
  res.json({ message: 'QR kod ile yoklama endpointi (stub)' });
};

exports.exportReportExcel = async (req, res) => {
  try {
    const { sectionId } = req.params;
    // Örnek veri: Gerçek uygulamada attendanceService.getReport(sectionId) ile alınmalı
    const report = await attendanceService.getReport(sectionId);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Yoklama Raporu');
    sheet.columns = [
      { header: 'Öğrenci No', key: 'studentNumber', width: 15 },
      { header: 'Ad Soyad', key: 'fullName', width: 25 },
      { header: 'Toplam Devam', key: 'presentCount', width: 15 },
      { header: 'Toplam Yoklama', key: 'totalCount', width: 15 },
      { header: 'Devamsızlık (%)', key: 'absencePercent', width: 15 },
    ];
    report.forEach(row => sheet.addRow(row));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="yoklama_raporu.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Excel export başarısız', details: err.message });
  }
};
