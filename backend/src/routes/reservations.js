const express = require('express');
const router = express.Router();
const reservationsController = require('../controllers/reservationsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

router.post('/', authenticate, reservationsController.createReservation);
router.get('/', authenticate, reservationsController.getReservations);
router.put('/:id/approve', authenticate, authorize(['admin']), reservationsController.approveReservation);
router.put('/:id/reject', authenticate, authorize(['admin']), reservationsController.rejectReservation);

module.exports = router;



