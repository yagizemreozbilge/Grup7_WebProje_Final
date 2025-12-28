const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const adminController = require('../controllers/adminController');

// Tüm akademisyenleri getir (admin only)
router.get('/faculty', authenticate, authorize(['admin']), adminController.getAllFaculty);

// Tüm ders şubelerini getir (admin only)
router.get('/sections', authenticate, authorize(['admin']), adminController.getAllSections);

// Ders şubesine akademisyen ata (admin only)
router.post('/assign-instructor', authenticate, authorize(['admin']), adminController.assignInstructorToSection);

module.exports = router;



