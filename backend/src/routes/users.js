const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { validateUpdateProfile } = require('../middleware/validation');
const upload = require('../middleware/upload');

// Protected routes
router.get('/me', authenticate, userController.getCurrentUser);
router.put('/me', authenticate, validateUpdateProfile, userController.updateProfile);
router.post('/me/profile-picture', authenticate, upload.single('profilePicture'), userController.uploadProfilePicture);
router.delete('/me/profile-picture', authenticate, userController.deleteProfilePicture);
router.get('/me/transcript', authenticate, userController.downloadTranscript);

// Admin only routes
router.get('/', authenticate, authorize('ADMIN'), userController.getAllUsers);

module.exports = router;
