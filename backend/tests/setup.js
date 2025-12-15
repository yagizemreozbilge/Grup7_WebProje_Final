// Test setup file

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
});

afterAll(() => {
  // Cleanup after all tests
});

// Global timeout for async tests
jest.setTimeout(30000);

// Mock console.log in tests to reduce noise
if (process.env.SUPPRESS_LOGS === 'true') {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
}
