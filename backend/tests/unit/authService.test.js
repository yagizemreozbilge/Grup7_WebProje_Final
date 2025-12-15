const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Mock modules before requiring authService
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  faculty: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  emailVerificationToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  passwordResetToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('../../src/prisma', () => mockPrisma);

jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

const authService = require('../../src/services/authService');
const jwtUtils = require('../../src/utils/jwt');

describe('authService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
  });

  // ==================== REGISTER TESTS ====================
  describe('register', () => {
    it('should register a new student successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'student@test.edu',
        role: 'student',
        fullName: 'Test Student',
        isVerified: true,
        student: { studentNumber: '20210001' }
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.student.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'student@test.edu',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'student',
        full_name: 'Test Student',
        student_number: '20210001',
        department_id: 'dept-1',
      });

      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result.email).toBe('student@test.edu');
    });

    it('should register a new faculty successfully', async () => {
      const mockUser = {
        id: 'user-2',
        email: 'faculty@test.edu',
        role: 'faculty',
        fullName: 'Test Faculty',
        isVerified: true,
        faculty: { employeeNumber: 'EMP001' }
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.faculty.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'faculty@test.edu',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'faculty',
        full_name: 'Test Faculty',
        employee_number: 'EMP001',
        department_id: 'dept-1',
        title: 'Professor'
      });

      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result.email).toBe('faculty@test.edu');
    });

    it('should throw error for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({
          email: 'dup@test.edu',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'student',
          student_number: '20210002',
          department_id: 'dept-1',
        })
      ).rejects.toThrow('Bu e-posta ile kullanıcı zaten var');
    });

    it('should throw error for duplicate student number', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.student.findUnique.mockResolvedValue({ studentNumber: '20210001' });

      await expect(
        authService.register({
          email: 'new@test.edu',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'student',
          student_number: '20210001',
          department_id: 'dept-1',
        })
      ).rejects.toThrow('Öğrenci numarası zaten kullanılıyor');
    });

    it('should throw error for duplicate employee number', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.faculty.findUnique.mockResolvedValue({ employeeNumber: 'EMP001' });

      await expect(
        authService.register({
          email: 'new@test.edu',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'faculty',
          employee_number: 'EMP001',
          department_id: 'dept-1',
          title: 'Professor'
        })
      ).rejects.toThrow('Personel numarası zaten kullanılıyor');
    });

    it('should throw error for missing required fields', async () => {
      await expect(
        authService.register({
          email: '',
          password: 'Password123',
          role: 'student',
        })
      ).rejects.toThrow('E-posta, şifre ve rol gereklidir');
    });

    it('should throw error for password mismatch', async () => {
      await expect(
        authService.register({
          email: 'test@test.edu',
          password: 'Password123',
          confirmPassword: 'Different123',
          role: 'student',
          student_number: '20210001',
          department_id: 'dept-1',
        })
      ).rejects.toThrow('Şifreler eşleşmiyor');
    });

    it('should throw error for missing student number', async () => {
      await expect(
        authService.register({
          email: 'test@test.edu',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'student',
          department_id: 'dept-1',
        })
      ).rejects.toThrow('Öğrenci numarası gereklidir');
    });

    it('should throw error for missing faculty fields', async () => {
      await expect(
        authService.register({
          email: 'test@test.edu',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'faculty',
          department_id: 'dept-1',
        })
      ).rejects.toThrow('Personel numarası ve ünvan gereklidir');
    });

    it('should throw error for missing department', async () => {
      await expect(
        authService.register({
          email: 'test@test.edu',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'student',
          student_number: '20210001',
        })
      ).rejects.toThrow('Bölüm seçimi gereklidir');
    });

    it('should normalize email to lowercase', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.student.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.edu',
        role: 'student'
      });

      await authService.register({
        email: 'TEST@TEST.EDU',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'student',
        student_number: '20210001',
        department_id: 'dept-1',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.edu' }
      });
    });
  });

  // ==================== LOGIN TESTS ====================
  describe('login', () => {
    it('should login with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 10);
      const mockUser = {
        id: 'user-1',
        email: 'student@test.edu',
        role: 'student',
        passwordHash: hashedPassword,
        isVerified: true,
        student: {
          studentNumber: '20210001',
          department: { name: 'CE', code: 'CE' },
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.login('student@test.edu', 'Password123');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('student@test.edu');
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login('nonexistent@test.edu', 'Password123')
      ).rejects.toThrow('Geçersiz e-posta veya şifre');
    });

    it('should throw error for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'student@test.edu',
        role: 'student',
        passwordHash: hashedPassword,
        isVerified: true,
      });

      await expect(
        authService.login('student@test.edu', 'WrongPassword')
      ).rejects.toThrow('Geçersiz e-posta veya şifre');
    });

    it('should throw error for unverified email when verification required', async () => {
      process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
      const hashedPassword = await bcrypt.hash('Password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'student@test.edu',
        role: 'student',
        passwordHash: hashedPassword,
        isVerified: false,
      });

      await expect(
        authService.login('student@test.edu', 'Password123')
      ).rejects.toThrow('E-posta adresinizi doğrulamanız gerekiyor');
    });

    it('should normalize email to lowercase on login', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'student@test.edu',
        passwordHash: hashedPassword,
        isVerified: true,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await authService.login('STUDENT@TEST.EDU', 'Password123');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'student@test.edu' }
        })
      );
    });
  });

  // ==================== VERIFY EMAIL TESTS ====================
  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const mockRecord = {
        id: 'token-1',
        userId: 'user-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: { id: 'user-1', email: 'test@test.edu', isVerified: false }
      };

      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockRecord);
      mockPrisma.$transaction.mockResolvedValue([]);

      await expect(authService.verifyEmail('valid-token')).resolves.toBeUndefined();
    });

    it('should throw error for invalid token', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(null);

      await expect(
        authService.verifyEmail('invalid-token')
      ).rejects.toThrow('Geçersiz doğrulama tokenı');
    });

    it('should throw error for expired token', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 1000),
        user: { isVerified: false }
      });

      await expect(
        authService.verifyEmail('expired-token')
      ).rejects.toThrow('Doğrulama tokenının süresi dolmuş');
    });

    it('should throw error if email already verified', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: { isVerified: true }
      });

      await expect(
        authService.verifyEmail('already-verified')
      ).rejects.toThrow('E-posta zaten doğrulanmış');
    });
  });

  // ==================== REFRESH TOKEN TESTS ====================
  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const payload = { id: 'user-1', email: 'test@test.edu', role: 'student' };
      const validRefreshToken = jwtUtils.generateRefreshToken(payload);

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        token: validRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const result = await authService.refreshToken(validRefreshToken);

      expect(result.accessToken).toBeDefined();
    });

    it('should throw error for invalid refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow();
    });

    it('should throw error for expired refresh token', async () => {
      const payload = { id: 'user-1', email: 'test@test.edu', role: 'student' };
      const validRefreshToken = jwtUtils.generateRefreshToken(payload);

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        token: validRefreshToken,
        expiresAt: new Date(Date.now() - 1000)
      });

      await expect(
        authService.refreshToken(validRefreshToken)
      ).rejects.toThrow('Geçersiz refresh token');
    });
  });

  // ==================== LOGOUT TESTS ====================
  describe('logout', () => {
    it('should logout successfully', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await authService.logout('user-1');

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' }
      });
    });
  });

  // ==================== FORGOT PASSWORD TESTS ====================
  describe('forgotPassword', () => {
    it('should create reset token for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@test.edu' });
      mockPrisma.passwordResetToken.create.mockResolvedValue({});

      await authService.forgotPassword('test@test.edu');

      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
    });

    it('should not throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.forgotPassword('nonexistent@test.edu')).resolves.toBeUndefined();
    });
  });

  // ==================== RESET PASSWORD TESTS ====================
  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: { id: 'user-1' }
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      await expect(
        authService.resetPassword('valid-token', 'NewPassword123', 'NewPassword123')
      ).resolves.toBeUndefined();
    });

    it('should throw error for password mismatch', async () => {
      await expect(
        authService.resetPassword('token', 'Password1', 'Password2')
      ).rejects.toThrow('Şifreler eşleşmiyor');
    });

    it('should throw error for invalid token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        authService.resetPassword('invalid', 'Password123', 'Password123')
      ).rejects.toThrow('Geçersiz veya süresi dolmuş sıfırlama tokenı');
    });

    it('should throw error for expired token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-1',
        expiresAt: new Date(Date.now() - 1000)
      });

      await expect(
        authService.resetPassword('expired', 'Password123', 'Password123')
      ).rejects.toThrow('Geçersiz veya süresi dolmuş sıfırlama tokenı');
    });
  });

  // ==================== JWT UTILS TESTS ====================
  describe('JWT Utils', () => {
    it('should generate access token', () => {
      const payload = { id: 'u1', email: 'x@test.edu', role: 'student' };
      const token = jwtUtils.generateAccessToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should generate refresh token', () => {
      const payload = { id: 'u1', email: 'x@test.edu', role: 'student' };
      const token = jwtUtils.generateRefreshToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should verify access token', () => {
      const payload = { id: 'u1', email: 'x@test.edu', role: 'student' };
      const token = jwtUtils.generateAccessToken(payload);
      const decoded = jwtUtils.verifyAccessToken(token);
      expect(decoded.id).toBe('u1');
      expect(decoded.email).toBe('x@test.edu');
    });

    it('should verify refresh token', () => {
      const payload = { id: 'u1', email: 'x@test.edu', role: 'student' };
      const token = jwtUtils.generateRefreshToken(payload);
      const decoded = jwtUtils.verifyRefreshToken(token);
      expect(decoded.id).toBe('u1');
    });

    it('should throw error for invalid access token', () => {
      expect(() => jwtUtils.verifyAccessToken('invalid')).toThrow();
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => jwtUtils.verifyRefreshToken('invalid')).toThrow();
    });
  });

  // ==================== BCRYPT TESTS ====================
  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'Password123';
      const hash = await bcrypt.hash(password, 10);
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should compare password correctly', async () => {
      const password = 'Password123';
      const hash = await bcrypt.hash(password, 10);
      expect(await bcrypt.compare(password, hash)).toBe(true);
      expect(await bcrypt.compare('Wrong', hash)).toBe(false);
    });
  });
});
