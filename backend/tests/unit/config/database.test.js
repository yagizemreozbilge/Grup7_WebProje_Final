// test/config/database.test.js
describe('Database Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear module cache
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('database config', () => {
    it('should export configuration object', () => {
      // Act
      const config = require('../../../src/config/database');

      // Assert
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should have development configuration', () => {
      // Arrange
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.DB_NAME = 'test_db';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';

      // Act
      const config = require('../../../src/config/database');

      // Assert
      expect(config.development).toBeDefined();
      expect(config.development.username).toBe('test_user');
      expect(config.development.password).toBe('test_password');
      expect(config.development.database).toBe('test_db');
      expect(config.development.host).toBe('localhost');
      expect(config.development.port).toBe('5432');
      expect(config.development.dialect).toBe('postgres');
    });

    it('should have production configuration', () => {
      // Act
      const config = require('../../../src/config/database');

      // Assert
      expect(config.production).toBeDefined();
      expect(config.production.use_env_variable).toBe('DATABASE_URL');
      expect(config.production.dialect).toBe('postgres');
    });

    it('should use environment variables for development config', () => {
      // Arrange
      process.env.DB_USER = 'env_user';
      process.env.DB_PASSWORD = 'env_pass';
      process.env.DB_NAME = 'env_db';
      process.env.DB_HOST = 'env_host';
      process.env.DB_PORT = '5433';

      // Act
      const config = require('../../../src/config/database');

      // Assert
      expect(config.development.username).toBe('env_user');
      expect(config.development.password).toBe('env_pass');
      expect(config.development.database).toBe('env_db');
      expect(config.development.host).toBe('env_host');
      expect(config.development.port).toBe('5433');
    });

    it('should handle missing environment variables', () => {
      // Arrange
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;

      // Act
      const config = require('../../../src/config/database');

      // Assert
      expect(config.development).toBeDefined();
      expect(config.development.username).toBeUndefined();
      expect(config.development.password).toBeUndefined();
      expect(config.development.database).toBeUndefined();
      expect(config.development.host).toBeUndefined();
      expect(config.development.port).toBeUndefined();
      expect(config.development.dialect).toBe('postgres');
    });

    it('should always use postgres dialect for development', () => {
      // Act
      const config = require('../../../src/config/database');

      // Assert
      expect(config.development.dialect).toBe('postgres');
    });

    it('should always use postgres dialect for production', () => {
      // Act
      const config = require('../../../src/config/database');

      // Assert
      expect(config.production.dialect).toBe('postgres');
    });
  });
});

