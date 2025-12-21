// test/routes/courses.test.js
const request = require('supertest');
const express = require('express');

// Mock controller
jest.mock('../../../src/controllers/courseController', () => ({
  getCourses: (req, res) => res.json({ route: 'getCourses' }),
  getCourseById: (req, res) => res.json({ route: 'getCourseById', id: req.params.id }),
  createCourse: (req, res) => res.json({ route: 'createCourse' }),
  updateCourse: (req, res) => res.json({ route: 'updateCourse', id: req.params.id }),
  deleteCourse: (req, res) => res.json({ route: 'deleteCourse', id: req.params.id })
}));

const coursesRoutes = require('../../../src/routes/courses');

describe('Courses Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/courses', coursesRoutes);

  test('GET /courses - should call getCourses controller', async () => {
    const res = await request(app).get('/courses');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getCourses');
  });

  test('GET /courses/:id - should call getCourseById controller', async () => {
    const res = await request(app).get('/courses/123');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getCourseById');
    expect(res.body.id).toBe('123');
  });

  test('POST /courses - should call createCourse controller', async () => {
    const courseData = { code: 'CS101', name: 'Introduction to Programming' };
    const res = await request(app).post('/courses').send(courseData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('createCourse');
  });

  test('PUT /courses/:id - should call updateCourse controller', async () => {
    const updateData = { name: 'Updated Course' };
    const res = await request(app).put('/courses/123').send(updateData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('updateCourse');
    expect(res.body.id).toBe('123');
  });

  test('DELETE /courses/:id - should call deleteCourse controller', async () => {
    const res = await request(app).delete('/courses/123');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('deleteCourse');
    expect(res.body.id).toBe('123');
  });
});