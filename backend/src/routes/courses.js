const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// GET /api/v1/courses - Ders listesi
router.get('/', courseController.getCourses);
// GET /api/v1/courses/:id - Ders detayları
router.get('/:id', courseController.getCourseById);
// POST /api/v1/courses - Yeni ders oluşturma (admin only)
router.post('/', courseController.createCourse);
// PUT /api/v1/courses/:id - Ders güncelleme (admin only)
router.put('/:id', courseController.updateCourse);
// DELETE /api/v1/courses/:id - Ders silme (soft delete, admin only)
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
