const request = require('supertest');
const express = require('express');
// Yollar 3 kat yukarıya güncellendi
const attendanceRoutes = require('../../src/routes/attendance');
const attendanceService = require('../../src/services/attendanceService');

jest.mock('../../src/services/attendanceService');
jest.mock('exceljs', () => {
  return {
    Workbook: jest.fn(() => ({
      addWorksheet: jest.fn(() => ({
        columns: [],
        addRow: jest.fn()
      })),
      xlsx: { write: jest.fn() }
    }))
  };
});

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
});