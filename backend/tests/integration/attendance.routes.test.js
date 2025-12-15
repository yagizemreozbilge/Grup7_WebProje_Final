const request = require('supertest');
const express = require('express');
const attendanceRoutes = require('../../src/routes/attendance');

const app = express();
app.use(express.json());

// mock auth
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user' };
    next();
  }
}));

// mock controller
jest.mock('../../src/controllers/attendanceController', () => ({
  createSession: (req, res) => res.status(201).json({ ok: true }),
  markAttendance: (req, res) => res.json({ ok: true }),
  getStatus: (req, res) => res.json({ ok: true }),
  getReport: (req, res) => res.json([]),
  submitExcuse: (req, res) => res.json({ ok: true }),
  markAttendanceQR: (req, res) => res.json({ ok: true }),
  exportReportExcel: (req, res) => res.end()
}));

app.use('/attendance', attendanceRoutes);

describe('Attendance Routes', () => {

  test('POST /sessions', async () => {
    const res = await request(app).post('/attendance/sessions');
    expect(res.statusCode).toBe(201);
  });

  test('POST /mark', async () => {
    const res = await request(app).post('/attendance/mark');
    expect(res.statusCode).toBe(200);
  });

  test('GET /report/:sectionId', async () => {
    const res = await request(app).get('/attendance/report/1');
    expect(res.statusCode).toBe(200);
  });

  test('POST /excuse', async () => {
    const res = await request(app).post('/attendance/excuse');
    expect(res.statusCode).toBe(200);
  });
});
