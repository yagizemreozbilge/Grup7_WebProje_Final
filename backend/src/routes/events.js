const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// Event routes
router.get('/', eventsController.getEvents);
router.get('/:id', eventsController.getEventById);
router.post('/', authenticate, authorize(['admin']), eventsController.createEvent);
router.put('/:id', authenticate, authorize(['admin']), eventsController.updateEvent);
router.delete('/:id', authenticate, authorize(['admin']), eventsController.deleteEvent);

// Registration routes
router.post('/:id/register', authenticate, eventsController.registerForEvent);
router.delete('/:eventId/registrations/:regId', authenticate, eventsController.cancelRegistration);
router.get('/:id/registrations', authenticate, authorize(['admin']), eventsController.getEventRegistrations);
router.post('/:eventId/registrations/:regId/checkin', authenticate, authorize(['admin']), eventsController.checkIn);

module.exports = router;


