const request = require('supertest');
const express = require('express');

// 🔹 Mock middlewares - Klasör derinliğine göre yollar güncellendi (3 kat yukarı)
jest.mock('../../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next()
}));

jest.mock('../../../src/middleware/validation', () => ({
  validateRegister: (req, res, next) => next(),
  validateLogin: (req, res, next) => next(),
  validateResetPassword: (req, res, next) => next()
}));

// 🔹 Mock controller - Klasör derinliğine göre yollar güncellendi (3 kat yukarı)
jest.mock('../../../src/controllers/authController', () => ({
  register: (req, res) => res.status(201).json({ route: 'register' }),
  verifyEmail: (req, res) => res.json({ route: 'verify-email' }),
  login: (req, res) => res.json({ route: 'login' }),
  refresh: (req, res) => res.json({ route: 'refresh' }),
  forgotPassword: (req, res) => res.json({ route: 'forgot-password' }),
  resetPassword: (req, res) => res.json({ route: 'reset-password' }),
  logout: (req, res) => res.json({ route: 'logout' })
}));

const authRoutes = require('../../../src/routes/auth');

describe('Auth Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);

  test('POST /auth/register', async () => {
    const res = await request(app).post('/auth/register');
    expect(res.statusCode).toBe(201);
    expect(res.body.route).toBe('register');
  });

  test('POST /auth/verify-email', async () => {
    const res = await request(app).post('/auth/verify-email');
    expect(res.body.route).toBe('verify-email');
  });

  test('POST /auth/login', async () => {
    const res = await request(app).post('/auth/login');
    expect(res.body.route).toBe('login');
  });

  test('POST /auth/refresh', async () => {
    const res = await request(app).post('/auth/refresh');
    expect(res.body.route).toBe('refresh');
  });

  test('POST /auth/forgot-password', async () => {
    const res = await request(app).post('/auth/forgot-password');
    expect(res.body.route).toBe('forgot-password');
  });

  test('POST /auth/reset-password', async () => {
    const res = await request(app).post('/auth/reset-password');
    expect(res.body.route).toBe('reset-password');
  });

  test('POST /auth/logout (protected)', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.body.route).toBe('logout');
  });
});