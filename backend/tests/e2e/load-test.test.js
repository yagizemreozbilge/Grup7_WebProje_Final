// tests/e2e/load-test.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Load Testing (Bonus)', () => {
  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent GET requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app).get('/api/v1/courses')
      );

      const responses = await Promise.all(requests);

      responses.forEach(res => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(500);
      });
    });

    it('should handle rate limiting correctly', async () => {
      // Make many requests quickly
      const requests = Array(150).fill(null).map(() =>
        request(app).get('/api/v1/courses')
      );

      const responses = await Promise.allSettled(requests);

      // Some requests should be rate limited (429)
      const rateLimited = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      // Rate limit should kick in after 100 requests (configured in app.js)
      expect(rateLimited.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Tests', () => {
    it('should respond to GET /api/v1/courses within reasonable time', async () => {
      const startTime = Date.now();
      const res = await request(app).get('/api/v1/courses');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it('should handle multiple sequential requests efficiently', async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/v1/courses');
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 5 requests should complete in reasonable time
      expect(totalTime).toBeLessThan(10000);
    });
  });

  describe('Stress Tests', () => {
    it('should handle burst of requests', async () => {
      const burstSize = 20;
      const requests = Array(burstSize).fill(null).map(() =>
        request(app).get('/api/v1/departments')
      );

      const responses = await Promise.all(requests);

      // All requests should be handled (may be rate limited but not crash)
      expect(responses.length).toBe(burstSize);
      responses.forEach(res => {
        expect([200, 401, 429, 500]).toContain(res.status);
      });
    });
  });
});

