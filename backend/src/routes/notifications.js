const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { authenticate } = require('../middleware/auth');

// All notification routes require authentication
router.use(authenticate);

// Get notifications list
router.get('/', notificationsController.getNotifications);

// Mark notification as read
router.put('/:id/read', notificationsController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', notificationsController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationsController.deleteNotification);

// Get notification preferences
router.get('/preferences', notificationsController.getPreferences);

// Update notification preferences
router.put('/preferences', notificationsController.updatePreferences);

module.exports = router;

