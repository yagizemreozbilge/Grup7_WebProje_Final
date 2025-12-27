// tests/integration/reservations.test.js
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/prisma');

describe('Reservations API Integration Tests', () => {
  let studentUser;
  let facultyUser;
  let adminUser;
  let studentToken;
  let facultyToken;
  let adminToken;
  let classroom;
  let reservation;

  beforeAll(async () => {
    await prisma.$transaction([
      prisma.classroomReservation.deleteMany(),
      prisma.classroom.deleteMany(),
      prisma.user.deleteMany()
    ]);
  });

  beforeEach(async () => {
    await prisma.classroomReservation.deleteMany();
    await prisma.classroom.deleteMany();
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
            departmentId: (await prisma.department.create({
              data: { name: 'CS', code: 'CS', facultyName: 'Engineering' }
            })).id
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
            departmentId: (await prisma.department.findFirst()).id
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

    classroom = await prisma.classroom.create({
      data: {
        name: 'A101',
        capacity: 50,
        building: 'A Building',
        floor: 1,
        equipment: ['Projector', 'Whiteboard']
      }
    });

    reservation = await prisma.classroomReservation.create({
      data: {
        classroomId: classroom.id,
        userId: studentUser.id,
        date: new Date('2025-12-31'),
        startTime: '09:00',
        endTime: '11:00',
        purpose: 'Study Group',
        status: 'PENDING'
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

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.edu', password: 'Password123' });
    adminToken = adminLogin.body.data.accessToken;
  });

  describe('GET /api/v1/reservations', () => {
    it('should get all reservations for admin', async () => {
      const res = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should get user reservations for student', async () => {
      const res = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/reservations');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/reservations', () => {
    it('should create reservation successfully', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classroomId: classroom.id,
          date: '2025-12-31',
          startTime: '14:00',
          endTime: '16:00',
          purpose: 'Study Session'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .send({
          classroomId: classroom.id,
          date: '2025-12-31',
          startTime: '14:00',
          endTime: '16:00',
          purpose: 'Study Session'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/reservations/:id/approve', () => {
    it('should approve reservation successfully (faculty/admin)', async () => {
      const res = await request(app)
        .put(`/api/v1/reservations/${reservation.id}/approve`)
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 for student users', async () => {
      const res = await request(app)
        .put(`/api/v1/reservations/${reservation.id}/approve`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/reservations/:id/reject', () => {
    it('should reject reservation successfully (faculty/admin)', async () => {
      const res = await request(app)
        .put(`/api/v1/reservations/${reservation.id}/reject`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ reason: 'Time conflict' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 for student users', async () => {
      const res = await request(app)
        .put(`/api/v1/reservations/${reservation.id}/reject`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ reason: 'Time conflict' });

      expect(res.status).toBe(403);
    });
  });
});

