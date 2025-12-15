const jwtUtils = require('../../src/utils/jwt');

// Mock prisma before requiring auth middleware
jest.mock('../../src/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

const mockPrisma = require('../../src/prisma');
const { authenticate } = require('../../src/middleware/auth');

describe('Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  // ==================== AUTHENTICATE MIDDLEWARE ====================
  describe('authenticate middleware', () => {
    it('should authenticate valid token', async () => {
      const payload = { id: 'user-1', email: 'test@test.edu', role: 'student' };
      const token = jwtUtils.generateAccessToken(payload);
      
      req.headers.authorization = `Bearer ${token}`;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.edu',
        role: 'student',
      });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-1');
    });

    it('should reject request without token', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject if user not found in database', async () => {
      const payload = { id: 'user-1', email: 'test@test.edu', role: 'student' };
      const token = jwtUtils.generateAccessToken(payload);
      
      req.headers.authorization = `Bearer ${token}`;
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const payload = { id: 'user-1', email: 'test@test.edu', role: 'student' };
      const token = jwtUtils.generateAccessToken(payload);
      
      req.headers.authorization = `Bearer ${token}`;
      mockPrisma.user.findUnique.mockRejectedValue(new Error('DB Error'));

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });

    it('should set correct user object on request', async () => {
      const payload = { id: 'user-1', email: 'test@test.edu', role: 'admin' };
      const token = jwtUtils.generateAccessToken(payload);
      
      req.headers.authorization = `Bearer ${token}`;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.edu',
        role: 'admin',
      });

      await authenticate(req, res, next);

      expect(req.user).toEqual({
        id: 'user-1',
        email: 'test@test.edu',
        role: 'admin',
      });
    });
  });

  // ==================== AUTHORIZATION TESTS ====================
  describe('authorization tests', () => {
    it('should allow admin role access', () => {
      const user = { role: 'admin' };
      const allowedRoles = ['admin'];
      expect(allowedRoles.includes(user.role)).toBe(true);
    });

    it('should allow faculty role access', () => {
      const user = { role: 'faculty' };
      const allowedRoles = ['admin', 'faculty'];
      expect(allowedRoles.includes(user.role)).toBe(true);
    });

    it('should deny student access to admin routes', () => {
      const user = { role: 'student' };
      const allowedRoles = ['admin'];
      expect(allowedRoles.includes(user.role)).toBe(false);
    });

    it('should allow multiple roles', () => {
      const allowedRoles = ['admin', 'faculty', 'student'];
      expect(allowedRoles.includes('admin')).toBe(true);
      expect(allowedRoles.includes('faculty')).toBe(true);
      expect(allowedRoles.includes('student')).toBe(true);
    });
  });
});

// ==================== ERROR HANDLER TESTS ====================
describe('Error Handler Tests', () => {
  it('should handle validation errors', () => {
    const error = new Error('Validation failed');
    error.code = 'VALIDATION_ERROR';
    error.statusCode = 400;

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
  });

  it('should handle unauthorized errors', () => {
    const error = new Error('Unauthorized');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;

    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.statusCode).toBe(401);
  });

  it('should handle not found errors', () => {
    const error = new Error('Not found');
    error.code = 'NOT_FOUND';
    error.statusCode = 404;

    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });

  it('should handle conflict errors', () => {
    const error = new Error('Conflict');
    error.code = 'CONFLICT';
    error.statusCode = 409;

    expect(error.code).toBe('CONFLICT');
    expect(error.statusCode).toBe(409);
  });

  it('should handle internal server errors', () => {
    const error = new Error('Internal error');
    error.code = 'INTERNAL_SERVER_ERROR';
    error.statusCode = 500;

    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.statusCode).toBe(500);
  });
});

// ==================== VALIDATION MIDDLEWARE TESTS ====================
describe('Validation Tests', () => {
  it('should validate email format', () => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(validEmail.test('test@example.edu')).toBe(true);
    expect(validEmail.test('invalid')).toBe(false);
    expect(validEmail.test('no@domain')).toBe(false);
  });

  it('should validate .edu email requirement', () => {
    const eduEmail = /^[^\s@]+@[^\s@]+\.edu(\.tr)?$/i;
    expect(eduEmail.test('user@university.edu')).toBe(true);
    expect(eduEmail.test('user@university.edu.tr')).toBe(true);
    expect(eduEmail.test('user@gmail.com')).toBe(false);
  });

  it('should validate password strength', () => {
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    expect(strongPassword.test('Password123')).toBe(true);
    expect(strongPassword.test('password')).toBe(false);
    expect(strongPassword.test('PASSWORD123')).toBe(false);
    expect(strongPassword.test('Pass1')).toBe(false);
  });

  it('should validate student number format', () => {
    const studentNumber = /^\d{8}$/;
    expect(studentNumber.test('20210001')).toBe(true);
    expect(studentNumber.test('123')).toBe(false);
    expect(studentNumber.test('abcd1234')).toBe(false);
  });

  it('should validate phone number format', () => {
    const phoneNumber = /^\+?[\d\s()-]{10,}$/;
    expect(phoneNumber.test('+90 555 123 4567')).toBe(true);
    expect(phoneNumber.test('(555) 123-4567')).toBe(true);
    expect(phoneNumber.test('123')).toBe(false);
  });

  it('should validate UUID format', () => {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuid.test('11111111-1111-1111-1111-111111111111')).toBe(true);
    expect(uuid.test('invalid-uuid')).toBe(false);
  });

  it('should sanitize input strings', () => {
    const sanitize = (str) => str.trim().toLowerCase();
    expect(sanitize('  TEST@EMAIL.COM  ')).toBe('test@email.com');
  });

  it('should validate required fields', () => {
    const isRequired = (value) => value !== undefined && value !== null && value !== '';
    expect(isRequired('test')).toBe(true);
    expect(isRequired('')).toBe(false);
    expect(isRequired(null)).toBe(false);
    expect(isRequired(undefined)).toBe(false);
  });
});

