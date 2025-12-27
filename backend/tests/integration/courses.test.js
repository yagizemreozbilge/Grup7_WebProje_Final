// tests/integration/courses.test.js
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/prisma');

describe('Courses API Integration Tests', () => {
  let department;
  let adminUser;
  let facultyUser;
  let adminToken;
  let facultyToken;
  let course;

  beforeAll(async () => {
    await prisma.$transaction([
      prisma.courseSection.deleteMany(),
      prisma.course.deleteMany(),
      prisma.department.deleteMany(),
      prisma.user.deleteMany()
    ]);

    department = await prisma.department.create({
      data: { name: 'Computer Science', code: 'CS', facultyName: 'Engineering' }
    });
  });

  beforeEach(async () => {
    await prisma.courseSection.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.edu',
        passwordHash: await bcrypt.hash('Password123', 10),
        role: 'ADMIN',
        fullName: 'Admin User',
        isVerified: true
      }
    });

    facultyUser = await prisma.user.create({
      data: {
        email: 'faculty@test.edu',
        passwordHash: await bcrypt.hash('Password123', 10),
        role: 'FACULTY',
        fullName: 'Faculty User',
        isVerified: true,
        faculty: {
          create: {
            employeeNumber: 'EMP001',
            title: 'Professor',
            departmentId: department.id
          }
        }
      }
    });

    course = await prisma.course.create({
      data: {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 3,
        departmentId: department.id,
        semester: 'FALL',
        year: 2024,
        isActive: true
      }
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.edu', password: 'Password123' });
    adminToken = adminLogin.body.data.accessToken;

    const facultyLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'faculty@test.edu', password: 'Password123' });
    facultyToken = facultyLogin.body.data.accessToken;
  });

  describe('GET /api/v1/courses', () => {
    it('should get all courses successfully', async () => {
      const res = await request(app)
        .get('/api/v1/courses');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter courses by department', async () => {
      const res = await request(app)
        .get(`/api/v1/courses?departmentId=${department.id}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter courses by semester', async () => {
      const res = await request(app)
        .get('/api/v1/courses?semester=FALL');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/courses/:id', () => {
    it('should get course by id successfully', async () => {
      const res = await request(app)
        .get(`/api/v1/courses/${course.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(course.id);
      expect(res.body.data.code).toBe('CS101');
    });

    it('should return 404 for non-existent course', async () => {
      const res = await request(app)
        .get('/api/v1/courses/non-existent-id');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/courses', () => {
    it('should create course successfully (admin only)', async () => {
      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS102',
          name: 'Data Structures',
          credits: 4,
          departmentId: department.id,
          semester: 'FALL',
          year: 2024
        });

      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe('CS102');
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          code: 'CS102',
          name: 'Data Structures',
          credits: 4,
          departmentId: department.id,
          semester: 'FALL',
          year: 2024
        });

      expect(res.status).toBe(403);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/courses')
        .send({
          code: 'CS102',
          name: 'Data Structures',
          credits: 4,
          departmentId: department.id,
          semester: 'FALL',
          year: 2024
        });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/courses/:id', () => {
    it('should update course successfully (admin only)', async () => {
      const res = await request(app)
        .put(`/api/v1/courses/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Course Name'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Course Name');
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .put(`/api/v1/courses/${course.id}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          name: 'Updated Course Name'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/courses/:id', () => {
    it('should delete course successfully (admin only)', async () => {
      const res = await request(app)
        .delete(`/api/v1/courses/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .delete(`/api/v1/courses/${course.id}`)
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(403);
    });
  });
});

