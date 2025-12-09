const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/prisma');
const { generateRefreshToken } = require('../../src/utils/jwt');

describe('Auth API (integration, Prisma)', () => {
  let department;
  let verifiedUser;

  beforeAll(async () => {
    // ensure clean
    await prisma.$transaction([
      prisma.refreshToken.deleteMany(),
      prisma.passwordResetToken.deleteMany(),
      prisma.emailVerificationToken.deleteMany(),
      prisma.student.deleteMany(),
      prisma.faculty.deleteMany(),
      prisma.user.deleteMany(),
      prisma.department.deleteMany()
    ]);
    department = await prisma.department.create({
      data: { name: 'Engineering', code: 'ENG', facultyName: 'Engineering' }
    });
  });

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.emailVerificationToken.deleteMany();
    await prisma.student.deleteMany();
    await prisma.faculty.deleteMany();
    await prisma.user.deleteMany();

    verifiedUser = await prisma.user.create({
      data: {
        email: 'verified@test.edu',
        passwordHash: await bcrypt.hash('Password123', 10),
        role: 'STUDENT',
        fullName: 'Verified User',
        isVerified: true
      }
    });
  });

  it('POST /auth/register - success', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'newstudent@test.edu',
        password: 'Password123',
        confirmPassword: 'Password123',
        full_name: 'New Student',
        role: 'student',
        student_number: '20210011',
        department_id: department.id
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('newstudent@test.edu');
  });

  it('POST /auth/register - duplicate email (409)', async () => {
    await prisma.user.create({
      data: {
        email: 'dup@test.edu',
        passwordHash: await bcrypt.hash('Password123', 10),
        role: 'STUDENT',
        isVerified: true
      }
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'dup@test.edu',
        password: 'Password123',
        confirmPassword: 'Password123',
        full_name: 'Dup User 2',
        role: 'student',
        student_number: '20210012',
        department_id: department.id
      });

    expect(res.status).toBe(409);
  });

  it('POST /auth/login - success', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'verified@test.edu', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('verified@test.edu');
  });

  it('POST /auth/login - unverified email (401)', async () => {
    await prisma.user.create({
      data: {
        email: 'pending@test.edu',
        passwordHash: await bcrypt.hash('Password123', 10),
        role: 'STUDENT',
        isVerified: false
      }
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pending@test.edu', password: 'Password123' });

    expect(res.status).toBe(401);
  });

  it('POST /auth/refresh - success', async () => {
    const refreshToken = generateRefreshToken({
      id: verifiedUser.id,
      email: verifiedUser.email,
      role: verifiedUser.role
    });
    await prisma.refreshToken.create({
      data: {
        userId: verifiedUser.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('POST /auth/logout - success', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'verified@test.edu', password: 'Password123' });

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({ refreshToken: login.body.data.refreshToken });

    expect(res.status).toBe(204);
  });

  it('POST /auth/verify-email - success', async () => {
    const unverifiedUser = await prisma.user.create({
      data: {
        email: 'unverified@test.edu',
        passwordHash: await bcrypt.hash('Password123', 10),
        role: 'STUDENT',
        isVerified: false,
      }
    });

    const token = 'test-verification-token';
    await prisma.emailVerificationToken.create({
      data: {
        userId: unverifiedUser.id,
        token: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /auth/forgot-password - success', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'verified@test.edu' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /auth/reset-password - success', async () => {
    const resetToken = 'test-reset-token';
    await prisma.passwordResetToken.create({
      data: {
        userId: verifiedUser.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /auth/refresh - invalid token (should fail)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
  });

  it('POST /auth/login - wrong password (should fail)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'verified@test.edu', password: 'WrongPassword' });

    expect(res.status).toBe(401);
  });
});