jest.mock('../../src/services/attendanceService');
jest.mock('exceljs', () => {
  return {
    Workbook: jest.fn(() => ({
      addWorksheet: jest.fn(() => ({
        columns: [],
        addRow: jest.fn()
      })),
      xlsx: {
        write: jest.fn()
      }
    }))
  };
});

const request = require('supertest');
const express = require('express');
const attendanceRoutes = require('../../src/routes/attendance');
const attendanceService = require('../../src/services/attendanceService');

const app = express();
app.use(express.json());

// Fake auth middleware
app.use((req, res, next) => {
  req.user = { id: 'user-1' };
  next();
});
app.use('/attendance', attendanceRoutes);

describe('Attendance Controller Integration', () => {

  afterEach(() => jest.clearAllMocks());

  test('creates attendance session', async () => {
    attendanceService.createSession.mockResolvedValue({ id: 1 });

    const res = await request(app)
      .post('/attendance/sessions')
      .send({
        section_id: 10,
        date: '2025-01-01',
        start_time: '2025-01-01T10:00',
        end_time: '2025-01-01T11:00'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(1);
  });

  test('fails creating session with missing params', async () => {
    const res = await request(app)
      .post('/attendance/sessions')
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test('marks attendance successfully', async () => {
    attendanceService.checkAttendance.mockResolvedValue({
      success: true
    });

    const res = await request(app)
      .post('/attendance/mark')
      .send({
        sessionId: 1,
        latitude: 40,
        longitude: 29
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('returns flagged attendance', async () => {
    attendanceService.checkAttendance.mockResolvedValue({
      success: false
    });

    const res = await request(app)
      .post('/attendance/mark')
      .send({
        sessionId: 1,
        latitude: 40,
        longitude: 29
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.warning).toBeDefined();
  });

  test('gets attendance report', async () => {
    attendanceService.getReport.mockResolvedValue([
      { studentId: 1 }
    ]);

    const res = await request(app)
      .get('/attendance/report/10');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test('submits excuse successfully', async () => {
    attendanceService.submitExcuse.mockResolvedValue({ id: 5 });

    const res = await request(app)
      .post('/attendance/excuse')
      .send({
        sessionId: 1,
        reason: 'Medical'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('exports excel report', async () => {
    attendanceService.getReport.mockResolvedValue([]);

    const res = await request(app)
      .get('/attendance/report/10/export');

    expect(res.statusCode).toBe(200);
  });
});
