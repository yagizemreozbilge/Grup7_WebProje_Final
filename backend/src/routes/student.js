const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const studentController = require('../controllers/studentController');


// Öğrencinin notları
router.get('/grades', authenticate, studentController.getGrades);
// Öğrencinin kayıtlı dersleri
router.get('/my-courses', authenticate, studentController.getMyCourses);

// Part 2: Enroll and Drop
router.post('/enroll', authenticate, studentController.enrollCourse);
router.post('/drop', authenticate, studentController.dropCourse);

module.exports = router;
