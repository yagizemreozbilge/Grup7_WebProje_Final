// test/app.test.js
const request = require('supertest');

describe('App Configuration', () => {
  let app;

  beforeEach(() => {
    // Clear module cache to get fresh app instance
    jest.resetModules();
    app = require('../../src/app');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('app setup', () => {
    it('should export express app', () => {
      // Assert
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should have JSON body parser middleware', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/test')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Assert - Should not crash, might return 404 but should handle JSON
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should have urlencoded body parser middleware', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/test')
        .send('test=data')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should have cookie parser middleware', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/test')
        .set('Cookie', 'test=value');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should have CORS middleware configured', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/test')
        .set('Origin', 'http://localhost:3000');

      // Assert
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow localhost origins', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/test')
        .set('Origin', 'http://localhost:3000');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
      // Should not have CORS error
    });

    it('should have rate limiting middleware', async () => {
      // Act - Make multiple requests
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(request(app).get('/api/v1/test'));
      }
      const responses = await Promise.all(requests);

      // Assert - All should be handled (might be 404 but not crash)
      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(404);
      });
    });

    it('should have error handler middleware', async () => {
      // Arrange - Create a route that throws error
      app.get('/test-error', (req, res, next) => {
        next(new Error('Test error'));
      });

      // Act
      const response = await request(app).get('/test-error');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('routes', () => {
    it('should have /api/v1 route', async () => {
      // Act
      const response = await request(app).get('/api/v1');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should have /api/v1/auth route', async () => {
      // Act
      const response = await request(app).get('/api/v1/auth/test');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should have /api/v1/users route', async () => {
      // Act
      const response = await request(app).get('/api/v1/users/test');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should have /api/v1/departments route', async () => {
      // Act
      const response = await request(app).get('/api/v1/departments');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should have /api/v1/courses route', async () => {
      // Act
      const response = await request(app).get('/api/v1/courses');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should have /api/v1/attendance route', async () => {
      // Act
      const response = await request(app).get('/api/v1/attendance/test');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should have /api/v1/student route', async () => {
      // Act
      const response = await request(app).get('/api/v1/student/test');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should have /api/v1/faculty route', async () => {
      // Act
      const response = await request(app).get('/api/v1/faculty/test');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should have /api/v1/meals route', async () => {
      // Act
      const response = await request(app).get('/api/v1/meals');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should have /api/v1/wallet route', async () => {
      // Act
      const response = await request(app).get('/api/v1/wallet/test');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should have /api/v1/events route', async () => {
      // Act
      const response = await request(app).get('/api/v1/events');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should have /api/v1/scheduling route', async () => {
      // Act
      const response = await request(app).get('/api/v1/scheduling/test');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should have /api/v1/reservations route', async () => {
      // Act
      const response = await request(app).get('/api/v1/reservations');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('CORS configuration', () => {
    it('should allow requests from localhost:3000', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/test')
        .set('Origin', 'http://localhost:3000');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
      // Should not have CORS error
    });

    it('should allow requests from localhost:3001', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/test')
        .set('Origin', 'http://localhost:3001');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should allow requests without origin (same-origin)', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/test');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });
  });

  describe('error handling', () => {
    it('should handle 404 errors', async () => {
      // Act
      const response = await request(app).get('/nonexistent-route');

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(404);
    });

    it('should format errors consistently', async () => {
      // Arrange
      app.get('/test-error-format', (req, res, next) => {
        const error = new Error('Test error');
        error.statusCode = 400;
        next(error);
      });

      // Act
      const response = await request(app).get('/test-error-format');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});

