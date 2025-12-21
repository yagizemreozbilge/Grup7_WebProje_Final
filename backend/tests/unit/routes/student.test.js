// test/routes/student.test.js
const request = require('supertest');
const express = require('express');

// Mock middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next()
}));

// Mock controller
jest.mock('../../../src/controllers/studentController', () => ({
  getGrades: (req, res) => res.json({ route: 'getGrades' }),
  getMyCourses: (req, res) => res.json({ route: 'getMyCourses' }),
  getAvailableCourses: (req, res) => res.json({ route: 'getAvailableCourses' }),
  getMyAttendance: (req, res) => res.json({ route: 'getMyAttendance' }),
  getAttendanceSummary: (req, res) => res.json({ route: 'getAttendanceSummary' }),
  enrollCourse: (req, res) => res.json({ route: 'enrollCourse' }),
  dropCourse: (req, res) => res.json({ route: 'dropCourse' })
}));

const studentRoutes = require('../../../src/routes/student');

describe('Student Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/student', studentRoutes);

  test('GET /student/grades - should call getGrades controller', async () => {
    const res = await request(app).get('/student/grades');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getGrades');
  });

  test('GET /student/my-courses - should call getMyCourses controller', async () => {
    const res = await request(app).get('/student/my-courses');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getMyCourses');
  });

  test('GET /student/available-courses - should call getAvailableCourses controller', async () => {
    const res = await request(app).get('/student/available-courses');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getAvailableCourses');
  });

  test('GET /student/attendance - should call getMyAttendance controller', async () => {
    const res = await request(app).get('/student/attendance');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getMyAttendance');
  });

  test('GET /student/attendance-summary - should call getAttendanceSummary controller', async () => {
    const res = await request(app).get('/student/attendance-summary');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getAttendanceSummary');
  });

  test('POST /student/enroll - should call enrollCourse controller', async () => {
    const enrollData = { courseId: 1, sectionId: 1 };
    const res = await request(app).post('/student/enroll').send(enrollData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('enrollCourse');
  });

  test('POST /student/drop - should call dropCourse controller', async () => {
    const dropData = { enrollmentId: 1 };
    const res = await request(app).post('/student/drop').send(dropData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('dropCourse');
  });
});