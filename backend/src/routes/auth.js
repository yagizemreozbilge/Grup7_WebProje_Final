const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin, validateResetPassword } = require('../middleware/validation');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);

module.exports = router;

