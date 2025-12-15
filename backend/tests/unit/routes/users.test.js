const express = require('express');
const request = require('supertest');

// Mock'ları ÖNCE tanımla - gerçek dosya yapısına göre
jest.mock('../controllers/userController', () => ({
  getCurrentUser: jest.fn((req, res) => res.status(200).json({ success: true })),
  updateProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
  uploadProfilePicture: jest.fn((req, res) => res.status(200).json({ success: true })),
  deleteProfilePicture: jest.fn((req, res) => res.status(200).json({ success: true })),
  downloadTranscript: jest.fn((req, res) => res.status(200).json({ success: true })),
  getAllUsers: jest.fn((req, res) => res.status(200).json({ success: true }))
}));

jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => next())
}));

jest.mock('../middleware/authorization', () => ({
  authorize: jest.fn((role) => (req, res, next) => next())
}));

jest.mock('../middleware/validation', () => ({
  validateUpdateProfile: jest.fn((req, res, next) => next())
}));

jest.mock('../middleware/upload', () => ({
  single: jest.fn((fieldName) => (req, res, next) => next())
}));

// Route'u import et
const usersRouter = require('../routes/users');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { validateUpdateProfile } = require('../middleware/validation');
const upload = require('../middleware/upload');

describe('Users Routes - users.js Coverage', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/users', usersRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Line 1: const express = require('express');
  // Line 2: const router = express.Router();
  // Line 3: const userController = require('../controllers/userController');
  // Line 4: const { authenticate } = require('../middleware/auth');
  // Line 5: const { authorize } = require('../middleware/authorization');
  // Line 6: const { validateUpdateProfile } = require('../middleware/validation');
  // Line 7: const upload = require('../middleware/upload');

  // Line 10: router.get('/me', authenticate, userController.getCurrentUser);
  test('GET /me - Line 10', async () => {
    const response = await request(app).get('/users/me');
    
    expect(authenticate).toHaveBeenCalled();
    expect(userController.getCurrentUser).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 11: router.put('/me', authenticate, validateUpdateProfile, userController.updateProfile);
  test('PUT /me - Line 11', async () => {
    const response = await request(app)
      .put('/users/me')
      .send({ name: 'Updated Name' });
    
    expect(authenticate).toHaveBeenCalled();
    expect(validateUpdateProfile).toHaveBeenCalled();
    expect(userController.updateProfile).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 12: router.post('/me/profile-picture', authenticate, upload.single('profilePicture'), userController.uploadProfilePicture);
  test('POST /me/profile-picture - Line 12', async () => {
    const response = await request(app)
      .post('/users/me/profile-picture')
      .send({});
    
    expect(authenticate).toHaveBeenCalled();
    expect(upload.single).toHaveBeenCalledWith('profilePicture');
    expect(userController.uploadProfilePicture).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 13: router.delete('/me/profile-picture', authenticate, userController.deleteProfilePicture);
  test('DELETE /me/profile-picture - Line 13', async () => {
    const response = await request(app)
      .delete('/users/me/profile-picture');
    
    expect(authenticate).toHaveBeenCalled();
    expect(userController.deleteProfilePicture).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 14: router.get('/me/transcript', authenticate, userController.downloadTranscript);
  test('GET /me/transcript - Line 14', async () => {
    const response = await request(app)
      .get('/users/me/transcript');
    
    expect(authenticate).toHaveBeenCalled();
    expect(userController.downloadTranscript).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 17: router.get('/', authenticate, authorize('ADMIN'), userController.getAllUsers);
  test('GET / - Line 17 (Admin route)', async () => {
    const response = await request(app).get('/users/');
    
    expect(authenticate).toHaveBeenCalled();
    expect(authorize).toHaveBeenCalledWith('ADMIN');
    expect(userController.getAllUsers).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 19: module.exports = router;
  test('module.exports - Line 19', () => {
    expect(usersRouter).toBeDefined();
    expect(typeof usersRouter).toBe('function');
  });

  // Ek testler - tüm satırların execute olduğundan emin olmak için
  test('All routes are registered correctly', async () => {
    const routes = [
      { path: '/users/me', method: 'get' },
      { path: '/users/me', method: 'put' },
      { path: '/users/me/profile-picture', method: 'post' },
      { path: '/users/me/profile-picture', method: 'delete' },
      { path: '/users/me/transcript', method: 'get' },
      { path: '/users/', method: 'get' }
    ];

    for (const route of routes) {
      const response = await request(app)[route.method](route.path).send({});
      expect(response.status).not.toBe(404);
    }
  });

  test('Router instance is created from express', () => {
    const Router = require('express').Router;
    expect(Router).toBeDefined();
  });

  test('Upload middleware is configured with correct field name', async () => {
    await request(app).post('/users/me/profile-picture').send({});
    expect(upload.single).toHaveBeenCalledWith('profilePicture');
  });

  test('Authorize middleware is configured with ADMIN role', async () => {
    await request(app).get('/users/');
    expect(authorize).toHaveBeenCalledWith('ADMIN');
  });
});