const authService = require('../../src/services/authService');
const { User, Student, Faculty, Department, sequelize } = require('../../models');
const bcrypt = require('bcrypt');

describe('Auth Service - Unit Tests', () => {
  let testDepartment;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
    
    // Create test department
    testDepartment = await Department.create({
      name: 'Test Department',
      code: 'TEST',
      faculty: 'Engineering'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean tables
    await User.destroy({ where: {}, force: true });
    await Student.destroy({ where: {}, force: true });
    await Faculty.destroy({ where: {}, force: true });
  });

  describe('register', () => {
    it('should register a new student successfully', async () => {
      const userData = {
        email: 'teststudent@test.com',
        password: 'Password123',
        role: 'student',
        full_name: 'Test Student',
        student_number: 'STU999',
        department_id: testDepartment.id
      };

      const user = await authService.register(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe('student');
      expect(user.is_verified).toBe(false);
      expect(user.password_hash).toBeUndefined();

      // Check student record
      const student = await Student.findOne({ where: { user_id: user.id } });
      expect(student).toBeDefined();
      expect(student.student_number).toBe('STU999');
    });

    it('should register a new faculty successfully', async () => {
      const userData = {
        email: 'testfaculty@test.com',
        password: 'Password123',
        role: 'faculty',
        full_name: 'Test Faculty',
        employee_number: 'EMP999',
        title: 'Professor',
        department_id: testDepartment.id
      };

      const user = await authService.register(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe('faculty');

      // Check faculty record
      const faculty = await Faculty.findOne({ where: { user_id: user.id } });
      expect(faculty).toBeDefined();
      expect(faculty.employee_number).toBe('EMP999');
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'Password123',
        role: 'student',
        student_number: 'STU001',
        department_id: testDepartment.id
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow('User with this email already exists');
    });

    it('should reject weak password', async () => {
      const userData = {
        email: 'weakpass@test.com',
        password: 'weak',
        role: 'student',
        student_number: 'STU002',
        department_id: testDepartment.id
      };

      await expect(authService.register(userData)).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should reject invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123',
        role: 'student',
        student_number: 'STU003',
        department_id: testDepartment.id
      };

      await expect(authService.register(userData)).rejects.toThrow('Invalid email format');
    });

    it('should reject student without student number', async () => {
      const userData = {
        email: 'nostudentnum@test.com',
        password: 'Password123',
        role: 'student',
        department_id: testDepartment.id
      };

      await expect(authService.register(userData)).rejects.toThrow('Student number and department are required');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const user = await User.create({
        email: 'verify@test.com',
        password_hash: 'hashedpassword',
        role: 'student',
        is_verified: false,
        verification_token: 'valid-token',
        verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const verifiedUser = await authService.verifyEmail('valid-token');

      expect(verifiedUser.is_verified).toBe(true);
      expect(verifiedUser.verification_token).toBeNull();
    });

    it('should reject invalid token', async () => {
      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow('Invalid or expired verification token');
    });

    it('should reject expired token', async () => {
      const user = await User.create({
        email: 'expired@test.com',
        password_hash: 'hashedpassword',
        role: 'student',
        is_verified: false,
        verification_token: 'expired-token',
        verification_token_expires: new Date(Date.now() - 1000) // Expired
      });

      await expect(authService.verifyEmail('expired-token')).rejects.toThrow('Verification token has expired');
    });
  });

  describe('login', () => {
    let testUser;
    const testPassword = 'Password123';

    beforeEach(async () => {
      const passwordHash = await bcrypt.hash(testPassword, 10);
      testUser = await User.create({
        email: 'login@test.com',
        password_hash: passwordHash,
        role: 'student',
        is_verified: true
      });
    });

    it('should login with valid credentials', async () => {
      const result = await authService.login('login@test.com', testPassword);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('login@test.com');
    });

    it('should reject invalid email', async () => {
      await expect(authService.login('nonexistent@test.com', testPassword)).rejects.toThrow('Invalid email or password');
    });

    it('should reject unverified email', async () => {
      const passwordHash = await bcrypt.hash(testPassword, 10);
      await User.create({
        email: 'unverified@test.com',
        password_hash: passwordHash,
        role: 'student',
        is_verified: false
      });

      await expect(authService.login('unverified@test.com', testPassword)).rejects.toThrow('Please verify your email');
    });

    it('should reject invalid password', async () => {
      await expect(authService.login('login@test.com', 'WrongPassword')).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const { generateRefreshToken, verifyRefreshToken } = require('../../src/utils/jwt');
      
      const user = await User.create({
        email: 'refresh@test.com',
        password_hash: 'hashed',
        role: 'student',
        is_verified: true
      });

      const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });
      user.refresh_token = refreshToken;
      await user.save();

      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow();
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const user = await User.create({
        email: 'forgot@test.com',
        password_hash: 'hashed',
        role: 'student',
        is_verified: true
      });

      // Mock email service
      const emailService = require('../../src/services/emailService');
      jest.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(true);

      const result = await authService.forgotPassword('forgot@test.com');

      expect(result).toBe(true);
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.reset_password_token).toBeDefined();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const user = await User.create({
        email: 'reset@test.com',
        password_hash: 'oldhash',
        role: 'student',
        is_verified: true,
        reset_password_token: 'valid-reset-token',
        reset_password_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      await authService.resetPassword('valid-reset-token', 'NewPassword123');

      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.password_hash).not.toBe('oldhash');
      expect(updatedUser.reset_password_token).toBeNull();
    });

    it('should reject invalid token', async () => {
      await expect(authService.resetPassword('invalid-token', 'NewPassword123')).rejects.toThrow('Invalid or expired reset token');
    });

    it('should reject weak password', async () => {
      const user = await User.create({
        email: 'weakpass@test.com',
        password_hash: 'oldhash',
        role: 'student',
        is_verified: true,
        reset_password_token: 'valid-token',
        reset_password_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      await expect(authService.resetPassword('valid-token', 'weak')).rejects.toThrow('Password must be at least 8 characters');
    });
  });
});

