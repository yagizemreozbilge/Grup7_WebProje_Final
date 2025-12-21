// test/routes/departments.test.js
const request = require('supertest');
const express = require('express');

// Mock prisma
jest.mock('../../../src/prisma', () => ({
  department: {
    findMany: jest.fn()
  }
}));

const prisma = require('../../../src/prisma');
const departmentsRoutes = require('../../../src/routes/departments');

describe('Departments Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/departments', departmentsRoutes);

  // Error handler for testing
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  });

  test('GET /departments - should return departments ordered by name', async () => {
    const mockDepartments = [
      { id: 1, name: 'Computer Science', code: 'CS' },
      { id: 2, name: 'Mathematics', code: 'MATH' }
    ];

    prisma.department.findMany.mockResolvedValue(mockDepartments);

    const res = await request(app).get('/departments');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockDepartments);
    expect(prisma.department.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' }
    });
  });

  test('GET /departments - should handle database error', async () => {
    prisma.department.findMany.mockRejectedValue(new Error('Database error'));

    const res = await request(app).get('/departments');
    
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Database error');
  });

  test('GET /departments - should return empty array when no departments', async () => {
    prisma.department.findMany.mockResolvedValue([]);

    const res = await request(app).get('/departments');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
});