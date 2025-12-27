const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const studentController = require('../controllers/studentController');


// Öğrencinin notları
router.get('/grades', authenticate, studentController.getGrades);
// Öğrencinin kayıtlı dersleri
router.get('/my-courses', authenticate, studentController.getMyCourses);
// Kayıt için uygun dersler
router.get('/available-courses', authenticate, studentController.getAvailableCourses);
// Öğrencinin yoklama geçmişi
router.get('/attendance', authenticate, studentController.getMyAttendance);
router.get('/attendance-summary', authenticate, studentController.getAttendanceSummary); // Added attendance summary route

// Yoklama verme (QR kod ile)
const attendanceController = require('../controllers/attendanceController');
router.post('/attendance/give/:sessionId', authenticate, attendanceController.giveAttendance);

// Part 2: Enroll and Drop
router.post('/enroll', authenticate, studentController.enrollCourse);
router.post('/drop', authenticate, studentController.dropCourse);

module.exports = router;
