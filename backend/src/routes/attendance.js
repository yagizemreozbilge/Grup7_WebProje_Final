const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// Yoklama oturumu açma (assignment'a uygun)
router.post('/sessions', authenticate, attendanceController.createSession);
// Yoklama verme
router.post('/mark', attendanceController.markAttendance);
// Yoklama durumu
router.get('/status', authenticate, attendanceController.getStatus);
// Yoklama raporu (genel)
router.get('/report', authenticate, attendanceController.getReport);
// Yoklama raporu (section bazlı) - frontend bu endpoint'i kullanıyor
router.get('/report/:sectionId', authenticate, attendanceController.getReport);
// Excel raporu
router.get('/report/:sectionId/export', authenticate, attendanceController.exportReportExcel);
// Mazeret bildirimi
router.post('/excuse', authenticate, attendanceController.submitExcuse);
// QR kod ile yoklama
router.post('/qr', attendanceController.markAttendanceQR);

module.exports = router;
