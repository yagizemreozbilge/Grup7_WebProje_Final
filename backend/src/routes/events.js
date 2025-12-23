const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// Event routes
router.get('/', eventsController.getEvents);
router.post('/', authenticate, authorize(['admin']), eventsController.createEvent);

// Registration routes (must be before /:id routes to avoid route conflicts)
router.get('/my-registrations', authenticate, eventsController.getMyRegistrations);
router.post('/:id/register', authenticate, eventsController.registerForEvent);
router.delete('/:eventId/registrations/:regId', authenticate, eventsController.cancelRegistration);
router.get('/:id/registrations', authenticate, authorize(['admin']), eventsController.getEventRegistrations);
router.post('/:eventId/registrations/:regId/checkin', authenticate, authorize(['admin']), eventsController.checkIn);

// Event detail routes (must be after specific routes)
router.get('/:id', eventsController.getEventById);
router.put('/:id', authenticate, authorize(['admin']), eventsController.updateEvent);
router.delete('/:id', authenticate, authorize(['admin']), eventsController.deleteEvent);

module.exports = router;





