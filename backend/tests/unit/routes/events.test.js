// test/routes/events.test.js
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
jest.mock('../../../src/controllers/eventsController', () => ({
  getEvents: (req, res) => res.json({ route: 'getEvents' }),
  getEventById: (req, res) => res.json({ route: 'getEventById', id: req.params.id }),
  createEvent: (req, res) => res.json({ route: 'createEvent' }),
  updateEvent: (req, res) => res.json({ route: 'updateEvent', id: req.params.id }),
  deleteEvent: (req, res) => res.json({ route: 'deleteEvent', id: req.params.id }),
  registerForEvent: (req, res) => res.json({ route: 'registerForEvent', id: req.params.id }),
  cancelRegistration: (req, res) => res.json({ 
    route: 'cancelRegistration', 
    eventId: req.params.eventId, 
    regId: req.params.regId 
  }),
  getEventRegistrations: (req, res) => res.json({ route: 'getEventRegistrations', id: req.params.id }),
  checkIn: (req, res) => res.json({ 
    route: 'checkIn', 
    eventId: req.params.eventId, 
    regId: req.params.regId 
  })
}));

const eventsRoutes = require('../../../src/routes/events');

describe('Events Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/events', eventsRoutes);

  test('GET /events - should call getEvents controller', async () => {
    const res = await request(app).get('/events');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getEvents');
  });

  test('GET /events/:id - should call getEventById controller', async () => {
    const res = await request(app).get('/events/123');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getEventById');
    expect(res.body.id).toBe('123');
  });

  test('POST /events - should call createEvent controller', async () => {
    const eventData = { title: 'Tech Conference', date: '2024-12-15' };
    const res = await request(app).post('/events').send(eventData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('createEvent');
  });

  test('PUT /events/:id - should call updateEvent controller', async () => {
    const updateData = { title: 'Updated Event' };
    const res = await request(app).put('/events/123').send(updateData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('updateEvent');
    expect(res.body.id).toBe('123');
  });

  test('DELETE /events/:id - should call deleteEvent controller', async () => {
    const res = await request(app).delete('/events/123');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('deleteEvent');
    expect(res.body.id).toBe('123');
  });

  test('POST /events/:id/register - should call registerForEvent controller', async () => {
    const regData = { userId: 1 };
    const res = await request(app).post('/events/123/register').send(regData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('registerForEvent');
    expect(res.body.id).toBe('123');
  });

  test('DELETE /events/:eventId/registrations/:regId - should call cancelRegistration controller', async () => {
    const res = await request(app).delete('/events/123/registrations/456');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('cancelRegistration');
    expect(res.body.eventId).toBe('123');
    expect(res.body.regId).toBe('456');
  });

  test('GET /events/:id/registrations - should call getEventRegistrations controller', async () => {
    const res = await request(app).get('/events/123/registrations');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getEventRegistrations');
    expect(res.body.id).toBe('123');
  });

  test('POST /events/:eventId/registrations/:regId/checkin - should call checkIn controller', async () => {
    const res = await request(app).post('/events/123/registrations/456/checkin');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('checkIn');
    expect(res.body.eventId).toBe('123');
    expect(res.body.regId).toBe('456');
  });
});