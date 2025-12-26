const express = require('express');
const router = express.Router();
const sensorsController = require('../controllers/sensorsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// Get sensors (public, but authenticated users get more info)
router.get('/', sensorsController.getSensors);

// Get sensor by ID
router.get('/:id', sensorsController.getSensorById);

// Get sensor data
router.get('/:id/data', sensorsController.getSensorData);

// Create sensor (admin only)
router.post('/', authenticate, authorize(['admin']), sensorsController.createSensor);

// Add sensor data (authenticated)
router.post('/:id/data', authenticate, sensorsController.addSensorData);

module.exports = router;

