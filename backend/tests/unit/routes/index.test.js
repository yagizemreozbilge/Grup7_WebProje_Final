// test/routes/index.test.js
const request = require('supertest');
const express = require('express');

const indexRoutes = require('../../../src/routes/index');

describe('Index Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/', indexRoutes);

  test('GET /health - should return health status', async () => {
    const res = await request(app).get('/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'OK',
      message: 'Campus Management System API is running',
      timestamp: expect.any(String)
    });
    
    // Verify timestamp is valid ISO string
    const date = new Date(res.body.timestamp);
    expect(date.toString()).not.toBe('Invalid Date');
  });

  test('GET /unknown - should return 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });

  test('POST /health - should return 404 for POST method', async () => {
    const res = await request(app).post('/health');
    expect(res.status).toBe(404);
  });

  test('PUT /health - should return 404 for PUT method', async () => {
    const res = await request(app).put('/health');
    expect(res.status).toBe(404);
  });

  test('DELETE /health - should return 404 for DELETE method', async () => {
    const res = await request(app).delete('/health');
    expect(res.status).toBe(404);
  });
});