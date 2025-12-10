const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/prisma');

describe('User API (integration, Prisma)', () => {
  let department;
  let studentUser;
  let adminUser;
  let studentToken;
  let adminToken;

  beforeAll(async () => {
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

    studentUser = await prisma.user.create({
      data: {
        email: 'student@test.edu',
        passwordHash: await bcrypt.hash('Password123', 10),
        role: 'STUDENT',
        fullName: 'Student User',
        isVerified: true,
        student: {
          create: {
            studentNumber: '20219999',
            departmentId: department.id
          }
        }
      }
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.edu',
        passwordHash: await bcrypt.hash('Password123', 10),
        role: 'ADMIN',
        fullName: 'Admin User',
        isVerified: true
      }
    });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student@test.edu', password: 'Password123' });
    studentToken = studentLogin.body.data.accessToken;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.edu', password: 'Password123' });
    adminToken = adminLogin.body.data.accessToken;
  });

  it('GET /users/me - success (with auth)', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('student@test.edu');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('GET /users/me - unauthorized (401)', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('PUT /users/me - success', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        full_name: 'Updated Name',
        phone: '(555) 123-4567'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Updated Name');
  });

  it('GET /users - admin only (403 for student)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('GET /users - admin success', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.users.length).toBeGreaterThan(0);
    expect(res.body.data.pagination.total).toBeGreaterThan(0);
  });
});