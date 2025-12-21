// test/routes/reservations.test.js
const request = require('supertest');
const express = require('express');

// Mock middlewares
jest.mock('../../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next()
}));

jest.mock('../../../src/middleware/authorization', () => ({
  authorize: () => (req, res, next) => next()
}));

// Mock controller
jest.mock('../../../src/controllers/reservationsController', () => ({
  createReservation: (req, res) => res.json({ route: 'createReservation' }),
  getReservations: (req, res) => res.json({ route: 'getReservations' }),
  approveReservation: (req, res) => res.json({ route: 'approveReservation', id: req.params.id }),
  rejectReservation: (req, res) => res.json({ route: 'rejectReservation', id: req.params.id })
}));

const reservationsRoutes = require('../../../src/routes/reservations');

describe('Reservations Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/reservations', reservationsRoutes);

  test('POST /reservations - should call createReservation controller', async () => {
    const reservationData = { facilityId: 1, date: '2024-12-15' };
    const res = await request(app).post('/reservations').send(reservationData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('createReservation');
  });

  test('GET /reservations - should call getReservations controller', async () => {
    const res = await request(app).get('/reservations');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getReservations');
  });

  test('PUT /reservations/:id/approve - should call approveReservation controller', async () => {
    const res = await request(app).put('/reservations/123/approve');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('approveReservation');
    expect(res.body.id).toBe('123');
  });

  test('PUT /reservations/:id/reject - should call rejectReservation controller', async () => {
    const rejectData = { reason: 'Facility unavailable' };
    const res = await request(app).put('/reservations/123/reject').send(rejectData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('rejectReservation');
    expect(res.body.id).toBe('123');
  });
});