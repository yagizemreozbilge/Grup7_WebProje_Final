const userService = require('../services/userService');
const path = require('path');

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await userService.getCurrentUser(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No file uploaded', details: [] }
      });
    }

    // Create URL path (relative to server)
    const filePath = `/uploads/${req.file.filename}`;
    const profilePictureUrl = await userService.updateProfilePicture(req.user.id, filePath);
    
    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: { profilePictureUrl }
    });
  } catch (error) {
    next(error);
  }
};

const deleteProfilePicture = async (req, res, next) => {
  try {
    await userService.deleteProfilePicture(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, role, department_id, search } = req.query;
    const result = await userService.getAllUsers({
      page,
      limit,
      role,
      department_id,
      search
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getAllUsers
};

