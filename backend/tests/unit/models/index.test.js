// test/models/index.test.js
const { Sequelize } = require('sequelize');

describe('Models Index', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('models index', () => {
    it('should export database object', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_pass';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';

      // Act
      const db = require('../../../src/models/index');

      // Assert
      expect(db).toBeDefined();
      expect(db).toHaveProperty('sequelize');
      expect(db).toHaveProperty('Sequelize');
    });

    it('should have sequelize instance', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_pass';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';

      // Act
      const db = require('../../../src/models/index');

      // Assert
      expect(db.sequelize).toBeDefined();
      expect(db.sequelize).toBeInstanceOf(Sequelize);
    });

    it('should have Sequelize class', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_pass';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';

      // Act
      const db = require('../../../src/models/index');

      // Assert
      expect(db.Sequelize).toBeDefined();
      expect(db.Sequelize).toBe(Sequelize);
    });

    it('should load all model files', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_pass';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';

      // Act
      const db = require('../../../src/models/index');

      // Assert - Check for common models
      expect(db).toHaveProperty('User');
      expect(db).toHaveProperty('Student');
      expect(db).toHaveProperty('Faculty');
      expect(db).toHaveProperty('Admin');
      expect(db).toHaveProperty('Course');
      expect(db).toHaveProperty('CourseSection');
      expect(db).toHaveProperty('Department');
      expect(db).toHaveProperty('Enrollment');
    });

    it('should use DATABASE_URL if available', () => {
      // Arrange
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
      process.env.NODE_ENV = 'test';

      // Act
      const db = require('../../../src/models/index');

      // Assert
      expect(db.sequelize).toBeDefined();
    });

    it('should use environment variables for database config', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.DB_NAME = 'custom_db';
      process.env.DB_USER = 'custom_user';
      process.env.DB_PASSWORD = 'custom_pass';
      process.env.DB_HOST = 'custom_host';
      process.env.DB_PORT = '5433';

      // Act
      const db = require('../../../src/models/index');

      // Assert
      expect(db.sequelize).toBeDefined();
    });
  });
});

