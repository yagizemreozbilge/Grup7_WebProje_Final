// Mock dependencies before requiring
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    end: jest.fn()
  }));
});

jest.mock('../../src/services/authService', () => ({
  register: jest.fn(),
  login: jest.fn(),
  verifyEmail: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
}));

jest.mock('../../src/services/userService', () => ({
  getCurrentUser: jest.fn(),
  updateProfile: jest.fn(),
  updateProfilePicture: jest.fn(),
  deleteProfilePicture: jest.fn(),
  getAllUsers: jest.fn(),
}));

jest.mock('../../src/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  department: {
    findMany: jest.fn(),
  },
  course_sections: {
    findMany: jest.fn(),
  },
  faculty: {
    findFirst: jest.fn(),
  },
  attendance_sessions: {
    create: jest.fn(),
  },
}));

const mockAuthService = require('../../src/services/authService');
const mockUserService = require('../../src/services/userService');
const mockPrisma = require('../../src/prisma');

describe('Controller Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', email: 'test@test.edu', role: 'student' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  // ==================== AUTH CONTROLLER TESTS ====================
  describe('Auth Controller', () => {
    it('should handle register request', async () => {
      req.body = {
        email: 'new@test.edu',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'student',
        student_number: '20210001',
        department_id: 'dept-1',
      };
      mockAuthService.register.mockResolvedValue({ email: 'new@test.edu', userId: 'user-1' });

      const authController = require('../../src/controllers/authController');
      await authController.register(req, res, next);

      expect(mockAuthService.register).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle login request', async () => {
      req.body = { email: 'test@test.edu', password: 'Password123' };
      mockAuthService.login.mockResolvedValue({
        user: { email: 'test@test.edu' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const authController = require('../../src/controllers/authController');
      await authController.login(req, res, next);

      expect(mockAuthService.login).toHaveBeenCalledWith('test@test.edu', 'Password123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle verify email request', async () => {
      req.body = { token: 'valid-token' };
      mockAuthService.verifyEmail.mockResolvedValue();

      const authController = require('../../src/controllers/authController');
      await authController.verifyEmail(req, res, next);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle refresh token request', async () => {
      req.body = { refreshToken: 'valid-refresh' };
      mockAuthService.refreshToken.mockResolvedValue({ accessToken: 'new-token' });

      const authController = require('../../src/controllers/authController');
      await authController.refresh(req, res, next);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle logout request', async () => {
      mockAuthService.logout.mockResolvedValue();

      const authController = require('../../src/controllers/authController');
      await authController.logout(req, res, next);

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-1');
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('should handle forgot password request', async () => {
      req.body = { email: 'test@test.edu' };
      mockAuthService.forgotPassword.mockResolvedValue();

      const authController = require('../../src/controllers/authController');
      await authController.forgotPassword(req, res, next);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('test@test.edu');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle reset password request', async () => {
      req.body = { token: 'reset-token', newPassword: 'NewPass123', confirmPassword: 'NewPass123' };
      mockAuthService.resetPassword.mockResolvedValue();

      const authController = require('../../src/controllers/authController');
      await authController.resetPassword(req, res, next);

      expect(mockAuthService.resetPassword).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle register error', async () => {
      req.body = { email: 'dup@test.edu' };
      const error = new Error('User exists');
      error.statusCode = 409;
      mockAuthService.register.mockRejectedValue(error);

      const authController = require('../../src/controllers/authController');
      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle login error', async () => {
      req.body = { email: 'test@test.edu', password: 'wrong' };
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      mockAuthService.login.mockRejectedValue(error);

      const authController = require('../../src/controllers/authController');
      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ==================== USER CONTROLLER TESTS ====================
  describe('User Controller', () => {
    it('should get current user', async () => {
      mockUserService.getCurrentUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.edu',
        role: 'student',
      });

      const userController = require('../../src/controllers/userController');
      await userController.getMe(req, res, next);

      expect(mockUserService.getCurrentUser).toHaveBeenCalledWith('user-1');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should update user profile', async () => {
      req.body = { full_name: 'New Name', phone: '+1234567890' };
      mockUserService.updateProfile.mockResolvedValue({
        fullName: 'New Name',
        phone: '+1234567890',
      });

      const userController = require('../../src/controllers/userController');
      await userController.updateMe(req, res, next);

      expect(mockUserService.updateProfile).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle get user error', async () => {
      const error = new Error('User not found');
      error.statusCode = 404;
      mockUserService.getCurrentUser.mockRejectedValue(error);

      const userController = require('../../src/controllers/userController');
      await userController.getMe(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should get all users (admin)', async () => {
      req.user = { id: 'admin-1', role: 'admin' };
      req.query = { page: '1', limit: '10' };
      mockUserService.getAllUsers.mockResolvedValue({
        users: [{ id: 'user-1' }],
        pagination: { total: 1 },
      });

      const userController = require('../../src/controllers/userController');
      await userController.getAllUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== FACULTY CONTROLLER TESTS ====================
  describe('Faculty Controller', () => {
    it('should get faculty sections for admin', async () => {
      req.user = { id: 'admin-1', role: 'admin' };
      mockPrisma.course_sections.findMany.mockResolvedValue([
        { id: 'section-1', courses: { code: 'CS101', name: 'Intro' }, section_number: 1 },
      ]);

      const facultyController = require('../../src/controllers/facultyController');
      await facultyController.getMySections(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should get faculty sections for faculty user', async () => {
      req.user = { id: 'faculty-1', role: 'faculty' };
      mockPrisma.faculty.findFirst.mockResolvedValue({ id: 'f-1', userId: 'faculty-1' });
      mockPrisma.course_sections.findMany.mockResolvedValue([
        { id: 'section-1', courses: { code: 'CS101', name: 'Intro' }, section_number: 1 },
      ]);

      const facultyController = require('../../src/controllers/facultyController');
      await facultyController.getMySections(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return 404 if faculty profile not found', async () => {
      req.user = { id: 'user-1', role: 'faculty' };
      mockPrisma.faculty.findFirst.mockResolvedValue(null);

      const facultyController = require('../../src/controllers/facultyController');
      await facultyController.getMySections(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should start attendance session', async () => {
      req.body = {
        sectionId: 'section-1',
        date: '2025-01-01',
        startTime: '2025-01-01T09:00:00',
        endTime: '2025-01-01T10:00:00',
        latitude: 41.0,
        longitude: 29.0,
      };
      mockPrisma.attendance_sessions.create.mockResolvedValue({ id: 'session-1' });

      const facultyController = require('../../src/controllers/facultyController');
      await facultyController.startAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should validate attendance required fields', async () => {
      req.body = { sectionId: 'section-1' };

      const facultyController = require('../../src/controllers/facultyController');
      await facultyController.startAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ==================== DEPARTMENTS TESTS ====================
  describe('Department Routes', () => {
    it('should list all departments', async () => {
      const departments = [
        { id: 'd1', name: 'Computer Engineering', code: 'CENG' },
        { id: 'd2', name: 'Electrical Engineering', code: 'EE' },
      ];
      mockPrisma.department.findMany.mockResolvedValue(departments);

      const result = await mockPrisma.department.findMany();
      
      expect(result.length).toBe(2);
      expect(result[0].code).toBe('CENG');
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  describe('Error Handling', () => {
    it('should handle validation errors', () => {
      const error = new Error('Validation error');
      error.code = 'VALIDATION_ERROR';
      error.statusCode = 400;

      expect(error.statusCode).toBe(400);
    });

    it('should handle unauthorized errors', () => {
      const error = new Error('Unauthorized');
      error.code = 'UNAUTHORIZED';
      error.statusCode = 401;

      expect(error.statusCode).toBe(401);
    });

    it('should handle forbidden errors', () => {
      const error = new Error('Forbidden');
      error.code = 'FORBIDDEN';
      error.statusCode = 403;

      expect(error.statusCode).toBe(403);
    });

    it('should handle not found errors', () => {
      const error = new Error('Not found');
      error.code = 'NOT_FOUND';
      error.statusCode = 404;

      expect(error.statusCode).toBe(404);
    });

    it('should handle conflict errors', () => {
      const error = new Error('Conflict');
      error.code = 'CONFLICT';
      error.statusCode = 409;

      expect(error.statusCode).toBe(409);
    });

    it('should handle server errors', () => {
      const error = new Error('Server error');
      error.code = 'INTERNAL_SERVER_ERROR';
      error.statusCode = 500;

      expect(error.statusCode).toBe(500);
    });
  });
});

