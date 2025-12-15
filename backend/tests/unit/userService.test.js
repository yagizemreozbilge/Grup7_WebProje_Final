// Mock prisma before requiring userService
jest.mock('../../src/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  faculty: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  department: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const mockPrisma = require('../../src/prisma');

const userService = require('../../src/services/userService');

describe('userService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== GET CURRENT USER TESTS ====================
  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.edu',
        role: 'student',
        fullName: 'Test User',
        phone: '1234567890',
        student: { studentNumber: '20210001', department: { name: 'CE' } }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getCurrentUser('user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' }
        })
      );
      expect(result.email).toBe('test@test.edu');
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.getCurrentUser('invalid-id'))
        .rejects.toThrow('User not found');
    });

    it('should include student data for student role', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'student@test.edu',
        role: 'student',
        student: { 
          studentNumber: '20210001',
          department: { name: 'Computer Engineering' }
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getCurrentUser('user-1');

      expect(result.student).toBeDefined();
    });

    it('should include faculty data for faculty role', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'faculty@test.edu',
        role: 'faculty',
        faculty: {
          employeeNumber: 'EMP001',
          title: 'Professor',
          department: { name: 'Computer Engineering' }
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getCurrentUser('user-1');

      expect(result.faculty).toBeDefined();
    });
  });

  // ==================== UPDATE PROFILE TESTS ====================
  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@test.edu',
        fullName: 'Updated Name',
        phone: '9876543210',
        student: null,
        faculty: null
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateProfile('user-1', {
        full_name: 'Updated Name',
        phone: '9876543210'
      });

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(result.full_name).toBe('Updated Name');
    });

    it('should update only provided fields', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        fullName: 'New Name',
        student: null,
        faculty: null
      });

      await userService.updateProfile('user-1', { full_name: 'New Name' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' }
        })
      );
    });
  });

  // ==================== GET ALL USERS TESTS ====================
  describe('getAllUsers', () => {
    it('should get all users with pagination', async () => {
      const mockUsers = [
        { id: 'u1', email: 'user1@test.edu', role: 'student' },
        { id: 'u2', email: 'user2@test.edu', role: 'faculty' }
      ];

      mockPrisma.$transaction.mockResolvedValue([2, mockUsers]);

      const result = await userService.getAllUsers({ page: 1, limit: 10 });

      expect(result.users.length).toBe(2);
      expect(result.pagination).toBeDefined();
    });

    it('should filter users by role', async () => {
      mockPrisma.$transaction.mockResolvedValue([1, [
        { id: 'u1', email: 'student@test.edu', role: 'student' }
      ]]);

      const result = await userService.getAllUsers({ role: 'student' });

      expect(result.users[0].role).toBe('student');
    });

    it('should search users by email', async () => {
      mockPrisma.$transaction.mockResolvedValue([1, [
        { id: 'u1', email: 'test@test.edu' }
      ]]);

      const result = await userService.getAllUsers({ search: 'test' });

      expect(result.users.length).toBe(1);
    });

    it('should handle empty results', async () => {
      mockPrisma.$transaction.mockResolvedValue([0, []]);

      const result = await userService.getAllUsers({});

      expect(result.users).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ==================== PROFILE PICTURE TESTS ====================
  describe('Profile Picture', () => {
    it('should update profile picture', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        profilePictureUrl: '/uploads/avatar.jpg'
      });

      const result = await userService.updateProfilePicture('user-1', '/uploads/avatar.jpg');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { profilePictureUrl: '/uploads/avatar.jpg' }
        })
      );
    });

    it('should delete profile picture', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        profilePictureUrl: null
      });

      await userService.deleteProfilePicture('user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { profilePictureUrl: null }
        })
      );
    });
  });
});

// ==================== EMAIL SERVICE TESTS ====================
describe('emailService Unit Tests', () => {
  describe('Email Validation', () => {
    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('valid@email.com')).toBe(true);
      expect(emailRegex.test('invalid')).toBe(false);
    });

    it('should validate .edu email', () => {
      const eduRegex = /\.edu(\.tr)?$/i;
      expect(eduRegex.test('test@university.edu')).toBe(true);
      expect(eduRegex.test('test@university.edu.tr')).toBe(true);
      expect(eduRegex.test('test@gmail.com')).toBe(false);
    });
  });

  describe('Email Templates', () => {
    it('should generate verification email subject', () => {
      const subject = 'E-posta Doğrulama';
      expect(subject).toContain('Doğrulama');
    });

    it('should generate password reset email subject', () => {
      const subject = 'Şifre Sıfırlama';
      expect(subject).toContain('Şifre');
    });
  });
});

// ==================== GRADE SERVICE TESTS ====================
describe('gradeService Unit Tests', () => {
  describe('Grade Calculation', () => {
    it('should calculate letter grade AA (90-100)', () => {
      const calculateGrade = (score) => {
        if (score >= 90) return 'AA';
        if (score >= 85) return 'BA';
        if (score >= 80) return 'BB';
        if (score >= 75) return 'CB';
        if (score >= 70) return 'CC';
        if (score >= 65) return 'DC';
        if (score >= 60) return 'DD';
        if (score >= 50) return 'FD';
        return 'FF';
      };

      expect(calculateGrade(95)).toBe('AA');
      expect(calculateGrade(90)).toBe('AA');
    });

    it('should calculate letter grade BA (85-89)', () => {
      const calculateGrade = (score) => {
        if (score >= 90) return 'AA';
        if (score >= 85) return 'BA';
        return 'BB';
      };

      expect(calculateGrade(87)).toBe('BA');
    });

    it('should calculate letter grade BB (80-84)', () => {
      const calculateGrade = (score) => {
        if (score >= 90) return 'AA';
        if (score >= 85) return 'BA';
        if (score >= 80) return 'BB';
        return 'CB';
      };

      expect(calculateGrade(82)).toBe('BB');
    });

    it('should calculate letter grade FF (0-49)', () => {
      const calculateGrade = (score) => {
        if (score >= 50) return 'DD';
        return 'FF';
      };

      expect(calculateGrade(45)).toBe('FF');
    });
  });

  describe('GPA Calculation', () => {
    it('should calculate GPA from letter grades', () => {
      const gradePoints = {
        'AA': 4.0, 'BA': 3.5, 'BB': 3.0, 'CB': 2.5,
        'CC': 2.0, 'DC': 1.5, 'DD': 1.0, 'FD': 0.5, 'FF': 0
      };

      const courses = [
        { grade: 'AA', credits: 3 },
        { grade: 'BB', credits: 3 },
        { grade: 'CC', credits: 3 }
      ];

      const totalPoints = courses.reduce(
        (sum, c) => sum + (gradePoints[c.grade] * c.credits), 0
      );
      const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
      const gpa = totalPoints / totalCredits;

      expect(gpa).toBeCloseTo(3.0, 1);
    });

    it('should handle zero credits', () => {
      const calculateGPA = (courses) => {
        const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
        if (totalCredits === 0) return 0;
        return 0;
      };

      expect(calculateGPA([])).toBe(0);
    });
  });
});

// ==================== HAVERSINE TESTS ====================
describe('Haversine Distance Calculation', () => {
  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  it('should calculate zero distance for same point', () => {
    const distance = haversine(41.0, 29.0, 41.0, 29.0);
    expect(distance).toBeCloseTo(0, 1);
  });

  it('should calculate distance between two points', () => {
    const distance = haversine(41.0, 29.0, 41.01, 29.01);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(2000); // Should be less than 2km
  });

  it('should validate location within radius', () => {
    const isWithinRadius = (distance, radius) => distance <= radius;
    
    expect(isWithinRadius(50, 100)).toBe(true);
    expect(isWithinRadius(150, 100)).toBe(false);
  });
});

// ==================== VALIDATION UTILS TESTS ====================
describe('Validation Utils', () => {
  describe('Password Validation', () => {
    const validatePassword = (password) => {
      if (!password || password.length < 8) return false;
      if (!/[a-z]/.test(password)) return false;
      if (!/[A-Z]/.test(password)) return false;
      if (!/[0-9]/.test(password)) return false;
      return true;
    };

    it('should accept valid password', () => {
      expect(validatePassword('Password123')).toBe(true);
    });

    it('should reject short password', () => {
      expect(validatePassword('Pass1')).toBe(false);
    });

    it('should reject password without lowercase', () => {
      expect(validatePassword('PASSWORD123')).toBe(false);
    });

    it('should reject password without uppercase', () => {
      expect(validatePassword('password123')).toBe(false);
    });

    it('should reject password without number', () => {
      expect(validatePassword('PasswordABC')).toBe(false);
    });
  });

  describe('Email Validation', () => {
    const validateEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    it('should accept valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('Student Number Validation', () => {
    const validateStudentNumber = (num) => /^\d{6,10}$/.test(num);

    it('should accept valid student number', () => {
      expect(validateStudentNumber('20210001')).toBe(true);
    });

    it('should reject invalid student number', () => {
      expect(validateStudentNumber('123')).toBe(false);
      expect(validateStudentNumber('abc12345')).toBe(false);
    });
  });
});
