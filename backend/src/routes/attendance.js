const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// Yoklama oturumu açma (assignment'a uygun)
router.post('/sessions', authenticate, attendanceController.createSession);
// Yoklama verme
router.post('/mark', attendanceController.markAttendance);
// Yoklama durumu
router.get('/status', attendanceController.getStatus);
// Yoklama raporu
router.get('/report', attendanceController.getReport);
// Excel raporu
router.get('/report/:sectionId/export', attendanceController.exportReportExcel);
// Mazeret bildirimi
router.post('/excuse', attendanceController.submitExcuse);
// QR kod ile yoklama
router.post('/qr', attendanceController.markAttendanceQR);

module.exports = router;
