// test/routes/meals.test.js
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
jest.mock('../../../src/controllers/mealsController', () => ({
  getMenus: (req, res) => res.json({ route: 'getMenus' }),
  getMenuById: (req, res) => res.json({ route: 'getMenuById', id: req.params.id }),
  createMenu: (req, res) => res.json({ route: 'createMenu' }),
  updateMenu: (req, res) => res.json({ route: 'updateMenu', id: req.params.id }),
  deleteMenu: (req, res) => res.json({ route: 'deleteMenu', id: req.params.id }),
  createReservation: (req, res) => res.json({ route: 'createReservation' }),
  cancelReservation: (req, res) => res.json({ route: 'cancelReservation', id: req.params.id }),
  getMyReservations: (req, res) => res.json({ route: 'getMyReservations' }),
  useReservation: (req, res) => res.json({ route: 'useReservation', id: req.params.id })
}));

const mealsRoutes = require('../../../src/routes/meals');

describe('Meals Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/meals', mealsRoutes);

  test('GET /meals/menus - should call getMenus controller', async () => {
    const res = await request(app).get('/meals/menus');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getMenus');
  });

  test('GET /meals/menus/:id - should call getMenuById controller', async () => {
    const res = await request(app).get('/meals/menus/123');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getMenuById');
    expect(res.body.id).toBe('123');
  });

  test('POST /meals/menus - should call createMenu controller', async () => {
    const menuData = { date: '2024-12-15', meals: ['Pasta', 'Salad'] };
    const res = await request(app).post('/meals/menus').send(menuData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('createMenu');
  });

  test('PUT /meals/menus/:id - should call updateMenu controller', async () => {
    const updateData = { price: 12.99 };
    const res = await request(app).put('/meals/menus/123').send(updateData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('updateMenu');
    expect(res.body.id).toBe('123');
  });

  test('DELETE /meals/menus/:id - should call deleteMenu controller', async () => {
    const res = await request(app).delete('/meals/menus/123');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('deleteMenu');
    expect(res.body.id).toBe('123');
  });

  test('POST /meals/reservations - should call createReservation controller', async () => {
    const reservationData = { menuId: 1, quantity: 2 };
    const res = await request(app).post('/meals/reservations').send(reservationData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('createReservation');
  });

  test('DELETE /meals/reservations/:id - should call cancelReservation controller', async () => {
    const res = await request(app).delete('/meals/reservations/123');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('cancelReservation');
    expect(res.body.id).toBe('123');
  });

  test('GET /meals/reservations/my-reservations - should call getMyReservations controller', async () => {
    const res = await request(app).get('/meals/reservations/my-reservations');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getMyReservations');
  });

  test('POST /meals/reservations/:id/use - should call useReservation controller', async () => {
    const res = await request(app).post('/meals/reservations/123/use');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('useReservation');
    expect(res.body.id).toBe('123');
  });
});