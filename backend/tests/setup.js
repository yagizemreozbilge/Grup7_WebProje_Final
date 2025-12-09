// Global test setup
// This file is loaded before all tests

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Increase timeout for database operations
jest.setTimeout(30000);

const prisma = require('../src/prisma');

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (e) {
    // ignore
  }
});