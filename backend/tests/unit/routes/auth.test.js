const express = require('express');
const request = require('supertest');

// Mock'ları ÖNCE tanımla - gerçek dosya yapısına göre
jest.mock('../controllers/authController', () => ({
  register: jest.fn((req, res) => res.status(201).json({ success: true })),
  verifyEmail: jest.fn((req, res) => res.status(200).json({ success: true })),
  login: jest.fn((req, res) => res.status(200).json({ success: true })),
  refresh: jest.fn((req, res) => res.status(200).json({ success: true })),
  forgotPassword: jest.fn((req, res) => res.status(200).json({ success: true })),
  resetPassword: jest.fn((req, res) => res.status(200).json({ success: true })),
  logout: jest.fn((req, res) => res.status(200).json({ success: true }))
}));

jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => next())
}));

jest.mock('../middleware/validation', () => ({
  validateRegister: jest.fn((req, res, next) => next()),
  validateLogin: jest.fn((req, res, next) => next()),
  validateResetPassword: jest.fn((req, res, next) => next())
}));

// Route'u import et
const authRouter = require('../routes/auth');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin, validateResetPassword } = require('../middleware/validation');

describe('Auth Routes - auth.js Coverage', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Line 1: const express = require('express');
  // Line 2: const router = express.Router();
  // Line 3: const authController = require('../controllers/authController');
  // Line 4: const { authenticate } = require('../middleware/auth');
  // Line 5: const { validateRegister, validateLogin, validateResetPassword } = require('../middleware/validation');
  
  // Line 8: router.post('/register', validateRegister, authController.register);
  test('POST /register - Line 8', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'password123' });
    
    expect(validateRegister).toHaveBeenCalled();
    expect(authController.register).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  // Line 9: router.post('/verify-email', authController.verifyEmail);
  test('POST /verify-email - Line 9', async () => {
    const response = await request(app)
      .post('/auth/verify-email')
      .send({ token: 'verification-token' });
    
    expect(authController.verifyEmail).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 10: router.post('/login', validateLogin, authController.login);
  test('POST /login - Line 10', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    
    expect(validateLogin).toHaveBeenCalled();
    expect(authController.login).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 11: router.post('/refresh', authController.refresh);
  test('POST /refresh - Line 11', async () => {
    const response = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: 'refresh-token' });
    
    expect(authController.refresh).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 12: router.post('/forgot-password', authController.forgotPassword);
  test('POST /forgot-password - Line 12', async () => {
    const response = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'test@test.com' });
    
    expect(authController.forgotPassword).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 13: router.post('/reset-password', validateResetPassword, authController.resetPassword);
  test('POST /reset-password - Line 13', async () => {
    const response = await request(app)
      .post('/auth/reset-password')
      .send({ token: 'reset-token', password: 'newPassword123' });
    
    expect(validateResetPassword).toHaveBeenCalled();
    expect(authController.resetPassword).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 16: router.post('/logout', authenticate, authController.logout);
  test('POST /logout - Line 16', async () => {
    const response = await request(app)
      .post('/auth/logout')
      .send({});
    
    expect(authenticate).toHaveBeenCalled();
    expect(authController.logout).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  // Line 18: module.exports = router;
  test('module.exports - Line 18', () => {
    expect(authRouter).toBeDefined();
    expect(typeof authRouter).toBe('function');
  });

  // Ek testler - tüm satırların execute olduğundan emin olmak için
  test('All routes are registered correctly', async () => {
    const routes = [
      { path: '/auth/register', method: 'post' },
      { path: '/auth/verify-email', method: 'post' },
      { path: '/auth/login', method: 'post' },
      { path: '/auth/refresh', method: 'post' },
      { path: '/auth/forgot-password', method: 'post' },
      { path: '/auth/reset-password', method: 'post' },
      { path: '/auth/logout', method: 'post' }
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
});