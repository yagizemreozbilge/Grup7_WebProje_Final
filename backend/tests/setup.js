// Global test setup
// This file is loaded before all tests

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Increase timeout for database operations
jest.setTimeout(30000);

// Close Sequelize connection once after all tests complete
const { sequelize } = require('../src/models');
afterAll(async() => {
    if (sequelize && sequelize.close) {
        await sequelize.close();
    }
});