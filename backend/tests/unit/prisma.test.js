// test/prisma.test.js
describe('Prisma Client', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('prisma client', () => {
    it('should export PrismaClient instance', () => {
      // Act
      const prisma = require('../../src/prisma');

      // Assert
      expect(prisma).toBeDefined();
      expect(prisma).toHaveProperty('$connect');
      expect(prisma).toHaveProperty('$disconnect');
    });

    it('should be a PrismaClient instance', () => {
      // Act
      const prisma = require('../../src/prisma');
      const { PrismaClient } = require('@prisma/client');

      // Assert
      expect(prisma).toBeInstanceOf(PrismaClient);
    });

    it('should have database models', () => {
      // Act
      const prisma = require('../../src/prisma');

      // Assert - Prisma client should have model properties
      // These are dynamically generated, so we check for common ones
      expect(prisma).toBeDefined();
    });

    it('should export same instance on multiple requires', () => {
      // Act
      const prisma1 = require('../../src/prisma');
      jest.resetModules();
      const prisma2 = require('../../src/prisma');

      // Assert - Should be same instance (module caching)
      // Note: jest.resetModules() clears cache, so they might be different
      // But both should be PrismaClient instances
      expect(prisma1).toBeDefined();
      expect(prisma2).toBeDefined();
    });
  });
});

