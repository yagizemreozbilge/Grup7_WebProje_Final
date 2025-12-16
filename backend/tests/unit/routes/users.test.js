const request = require('supertest');
const express = require('express');

// 🔹 Mock middlewares - Yollar 3 kat yukarıya güncellendi
jest.mock('../../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next()
}));

jest.mock('../../../src/middleware/authorization', () => ({
  authorize: () => (req, res, next) => next()
}));

jest.mock('../../../src/middleware/validation', () => ({
  validateUpdateProfile: (req, res, next) => next()
}));

jest.mock('../../../src/middleware/upload', () => ({
  single: () => (req, res, next) => next()
}));

// 🔹 Mock controller
jest.mock('../../../src/controllers/userController', () => ({
  getCurrentUser: (req, res) => res.json({ route: 'me' }),
  updateProfile: (req, res) => res.json({ route: 'update-profile' }),
  uploadProfilePicture: (req, res) => res.json({ route: 'upload-picture' }),
  deleteProfilePicture: (req, res) => res.json({ route: 'delete-picture' }),
  downloadTranscript: (req, res) => res.json({ route: 'transcript' }),
  getAllUsers: (req, res) => res.json({ route: 'all-users' })
}));

const userRoutes = require('../../../src/routes/users');

describe('User Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/users', userRoutes);

  test('GET /users/me', async () => {
    const res = await request(app).get('/users/me');
    expect(res.body.route).toBe('me');
  });

  test('PUT /users/me', async () => {
    const res = await request(app).put('/users/me');
    expect(res.body.route).toBe('update-profile');
  });

  test('POST /users/me/profile-picture', async () => {
    const res = await request(app).post('/users/me/profile-picture');
    expect(res.body.route).toBe('upload-picture');
  });
});