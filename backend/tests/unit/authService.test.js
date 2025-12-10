const bcrypt = require('bcrypt');
const authService = require('../../src/services/authService');
const jwtUtils = require('../../src/utils/jwt');

// Mock Prisma Client
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
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('../../src/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

describe('authService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Register user with valid data', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'new@test.edu',
      role: 'STUDENT',
      fullName: 'New User',
      passwordHash: 'hashed',
      isVerified: false,
    };

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.student.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.student.create.mockResolvedValue({});
    mockPrisma.emailVerificationToken.create.mockResolvedValue({});

    const result = await authService.register({
      email: 'new@test.edu',
      password: 'Password123',
      role: 'STUDENT',
      fullName: 'New User',
      studentNumber: '20210001',
      departmentId: 'dep-1',
    });

    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockPrisma.student.create).toHaveBeenCalled();
    expect(result.email).toBe('new@test.edu');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('Register user with duplicate email (should fail)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      authService.register({
        email: 'dup@test.edu',
        password: 'Password123',
        role: 'STUDENT',
        studentNumber: '20210002',
        departmentId: 'dep-1',
      })
    ).rejects.toThrow('User with this email already exists');
  });

  it('Login with correct credentials', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'student@test.edu',
      role: 'STUDENT',
      passwordHash: await bcrypt.hash('Password123', 10),
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

  it('Login with wrong password (should fail)', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'student@test.edu',
      role: 'STUDENT',
      passwordHash: await bcrypt.hash('Password123', 10),
      isVerified: true,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authService.login('student@test.edu', 'WrongPass')
    ).rejects.toThrow('Invalid email or password');
  });

  it('Generate JWT tokens', () => {
    const payload = { id: 'u1', email: 'x@test.edu', role: 'STUDENT' };
    const access = jwtUtils.generateAccessToken(payload);
    const refresh = jwtUtils.generateRefreshToken(payload);
    const decoded = jwtUtils.verifyAccessToken(access);

    expect(decoded.id).toBe(payload.id);
    expect(typeof access).toBe('string');
    expect(typeof refresh).toBe('string');
  });

  it('Verify JWT token', () => {
    const payload = { id: 'u1', email: 'x@test.edu', role: 'STUDENT' };
    const token = jwtUtils.generateAccessToken(payload);
    const decoded = jwtUtils.verifyAccessToken(token);

    expect(decoded.id).toBe('u1');
    expect(decoded.email).toBe('x@test.edu');
  });

  it('Hash password (bcrypt)', async () => {
    const password = 'Password123';
    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2')).toBe(true);
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare('Wrong', hash)).toBe(false);
  });

  it('Compare password', async () => {
    const password = 'Password123';
    const hash = await bcrypt.hash(password, 10);

    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare('WrongPass', hash)).toBe(false);
  });
});
