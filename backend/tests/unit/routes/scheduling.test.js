// test/routes/scheduling.test.js
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
jest.mock('../../../src/controllers/schedulingController', () => ({
  generateSchedule: (req, res) => res.json({ route: 'generateSchedule' }),
  getSchedule: (req, res) => res.json({ route: 'getSchedule', scheduleId: req.params.scheduleId }),
  getMySchedule: (req, res) => res.json({ route: 'getMySchedule' }),
  getMyScheduleICal: (req, res) => res.json({ route: 'getMyScheduleICal' })
}));

const schedulingRoutes = require('../../../src/routes/scheduling');

describe('Scheduling Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/scheduling', schedulingRoutes);

  test('POST /scheduling/generate - should call generateSchedule controller', async () => {
    const scheduleData = { semester: 'Fall 2024' };
    const res = await request(app).post('/scheduling/generate').send(scheduleData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('generateSchedule');
  });

  test('GET /scheduling/:scheduleId - should call getSchedule controller', async () => {
    const res = await request(app).get('/scheduling/123');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getSchedule');
    expect(res.body.scheduleId).toBe('123');
  });

  test('GET /scheduling/my-schedule - should call getMySchedule controller', async () => {
    const res = await request(app).get('/scheduling/my-schedule');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getMySchedule');
  });

  test('GET /scheduling/my-schedule/ical - should call getMyScheduleICal controller', async () => {
    const res = await request(app).get('/scheduling/my-schedule/ical');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getMyScheduleICal');
  });
});