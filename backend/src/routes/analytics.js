const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// All analytics routes require admin authentication
router.use(authenticate);
router.use(authorize(['admin']));

// Dashboard statistics
router.get('/dashboard', analyticsController.getDashboard);

// Academic performance analytics
router.get('/academic-performance', analyticsController.getAcademicPerformance);

// Attendance analytics
router.get('/attendance', analyticsController.getAttendanceAnalytics);

// Meal usage analytics
router.get('/meal-usage', analyticsController.getMealUsage);

// Event analytics
router.get('/events', analyticsController.getEventAnalytics);

// Export reports
router.get('/export/:type', analyticsController.exportReport);

module.exports = router;

