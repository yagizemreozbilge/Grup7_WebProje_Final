const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const facultyController = require('../controllers/facultyController');

// Yoklama başlat
router.post('/attendance/start', authenticate, facultyController.startAttendance);
router.get('/sections', authenticate, facultyController.getMySections);

// Grade management
router.post('/grades', authenticate, facultyController.enterGrade);
router.get('/grades/:sectionId', authenticate, facultyController.getSectionGrades);

module.exports = router;
