const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactorController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.post('/generate', authenticate, twoFactorController.generateSecret);
router.post('/verify-enable', authenticate, twoFactorController.verifyAndEnable);
router.post('/disable', authenticate, twoFactorController.disable);
router.post('/verify', twoFactorController.verifyToken); // Public route for login verification

module.exports = router;

