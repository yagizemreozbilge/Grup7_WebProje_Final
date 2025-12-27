// tests/integration/student.test.js
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/prisma');

describe('Student API Integration Tests', () => {
  let department;
  let studentUser;
  let facultyUser;
  let studentToken;
  let facultyToken;
  let course;
  let section;

  beforeAll(async () => {
    await prisma.$transaction([
      prisma.enrollment.deleteMany(),
      prisma.attendanceRecord.deleteMany(),
      prisma.attendanceSession.deleteMany(),
      prisma.courseSection.deleteMany(),
      prisma.course.deleteMany(),
      prisma.student.deleteMany(),
      prisma.faculty.deleteMany(),
      prisma.user.deleteMany(),
      prisma.department.deleteMany()
    ]);

    department = await prisma.department.create({
      data: { name: 'Computer Science', code: 'CS', facultyName: 'Engineering' }
    });
  });

  beforeEach(async () => {
    await prisma.enrollment.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.attendanceSession.deleteMany();
    await prisma.courseSection.deleteMany();
    await prisma.course.deleteMany();
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
            studentNumber: '20210001',
            departmentId: department.id
          }
        }
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

    section = await prisma.courseSection.create({
      data: {
        courseId: course.id,
        sectionNumber: '01',
        instructorId: (await prisma.faculty.findUnique({ where: { userId: facultyUser.id } })).id,
        capacity: 30,
        enrolledCount: 0,
        isActive: true
      }
    });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student@test.edu', password: 'Password123' });
    studentToken = studentLogin.body.data.accessToken;

    const facultyLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'faculty@test.edu', password: 'Password123' });
    facultyToken = facultyLogin.body.data.accessToken;
  });

  describe('GET /api/v1/student/grades', () => {
    it('should get student grades successfully', async () => {
      const res = await request(app)
        .get('/api/v1/student/grades')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('grades');
      expect(res.body).toHaveProperty('gpa');
      expect(res.body).toHaveProperty('cgpa');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/student/grades');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/student/my-courses', () => {
    it('should get student courses successfully', async () => {
      const res = await request(app)
        .get('/api/v1/student/my-courses')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/student/my-courses');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/student/enroll', () => {
    it('should enroll student in course successfully', async () => {
      const res = await request(app)
        .post('/api/v1/student/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ sectionId: section.id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 if sectionId is missing', async () => {
      const res = await request(app)
        .post('/api/v1/student/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/student/enroll')
        .send({ sectionId: section.id });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/student/drop', () => {
    it('should drop course successfully', async () => {
      // First enroll
      await request(app)
        .post('/api/v1/student/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ sectionId: section.id });

      // Then drop
      const res = await request(app)
        .post('/api/v1/student/drop')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ sectionId: section.id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 if not enrolled', async () => {
      const res = await request(app)
        .post('/api/v1/student/drop')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ sectionId: section.id });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/student/available-courses', () => {
    it('should get available courses successfully', async () => {
      const res = await request(app)
        .get('/api/v1/student/available-courses')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/student/available-courses');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/student/attendance', () => {
    it('should get attendance records successfully', async () => {
      const res = await request(app)
        .get('/api/v1/student/attendance')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/student/attendance');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/student/attendance-summary', () => {
    it('should get attendance summary successfully', async () => {
      const res = await request(app)
        .get('/api/v1/student/attendance-summary')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/student/attendance-summary');

      expect(res.status).toBe(401);
    });
  });
});

