const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const facultyController = require('../controllers/facultyController');

// Yoklama başlat
router.post('/attendance/start', authenticate, facultyController.startAttendance);

module.exports = router;
