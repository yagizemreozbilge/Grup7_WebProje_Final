// test/routes/faculty.test.js
const request = require('supertest');
const express = require('express');

// Mock middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next()
}));

// Mock controller
jest.mock('../../../src/controllers/facultyController', () => ({
  startAttendance: (req, res) => res.json({ route: 'startAttendance' }),
  getMySections: (req, res) => res.json({ route: 'getMySections' }),
  enterGrade: (req, res) => res.json({ route: 'enterGrade' }),
  getSectionGrades: (req, res) => res.json({ route: 'getSectionGrades', sectionId: req.params.sectionId })
}));

const facultyRoutes = require('../../../src/routes/faculty');

describe('Faculty Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/faculty', facultyRoutes);

  test('POST /faculty/attendance/start - should call startAttendance controller', async () => {
    const attendanceData = { sectionId: 1, attendanceCode: 'ABC123' };
    const res = await request(app).post('/faculty/attendance/start').send(attendanceData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('startAttendance');
  });

  test('GET /faculty/sections - should call getMySections controller', async () => {
    const res = await request(app).get('/faculty/sections');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getMySections');
  });

  test('POST /faculty/grades - should call enterGrade controller', async () => {
    const gradeData = { studentId: 1, sectionId: 1, grade: 'A' };
    const res = await request(app).post('/faculty/grades').send(gradeData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('enterGrade');
  });

  test('GET /faculty/grades/:sectionId - should call getSectionGrades controller', async () => {
    const res = await request(app).get('/faculty/grades/123');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getSectionGrades');
    expect(res.body.sectionId).toBe('123');
  });
});