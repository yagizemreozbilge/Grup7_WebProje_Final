// tests/integration/events.test.js
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/prisma');

describe('Events API Integration Tests', () => {
  let studentUser;
  let adminUser;
  let studentToken;
  let adminToken;
  let event;

  beforeAll(async () => {
    await prisma.$transaction([
      prisma.eventRegistration.deleteMany(),
      prisma.event.deleteMany(),
      prisma.user.deleteMany()
    ]);
  });

  beforeEach(async () => {
    await prisma.eventRegistration.deleteMany();
    await prisma.event.deleteMany();
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

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.edu',
        passwordHash: await bcrypt.hash('Password123', 10),
        role: 'ADMIN',
        fullName: 'Admin User',
        isVerified: true
      }
    });

    event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Description',
        date: new Date('2025-12-31'),
        location: 'Test Location',
        category: 'ACADEMIC',
        isPublished: true,
        registrationDeadline: new Date('2025-12-30'),
        capacity: 100,
        price: 0
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

  describe('GET /api/v1/events', () => {
    it('should get all events successfully', async () => {
      const res = await request(app)
        .get('/api/v1/events');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter events by category', async () => {
      const res = await request(app)
        .get('/api/v1/events?category=ACADEMIC');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter events by date', async () => {
      const res = await request(app)
        .get('/api/v1/events?date=2025-12-31');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/events/:id', () => {
    it('should get event by id successfully', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${event.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(event.id);
      expect(res.body.data.title).toBe('Test Event');
    });

    it('should return 404 for non-existent event', async () => {
      const res = await request(app)
        .get('/api/v1/events/non-existent-id');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/events', () => {
    it('should create event successfully (admin only)', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Event',
          description: 'New Description',
          date: '2025-12-31',
          location: 'New Location',
          category: 'SOCIAL',
          capacity: 50,
          price: 0
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('New Event');
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'New Event',
          description: 'New Description',
          date: '2025-12-31',
          location: 'New Location',
          category: 'SOCIAL',
          capacity: 50,
          price: 0
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/events/:id/register', () => {
    it('should register for event successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/events/${event.id}/register`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent event', async () => {
      const res = await request(app)
        .post('/api/v1/events/non-existent-id/register')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post(`/api/v1/events/${event.id}/register`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/events/:id/cancel', () => {
    it('should cancel registration successfully', async () => {
      // First register
      await request(app)
        .post(`/api/v1/events/${event.id}/register`)
        .set('Authorization', `Bearer ${studentToken}`);

      // Then cancel
      const res = await request(app)
        .post(`/api/v1/events/${event.id}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 if not registered', async () => {
      const res = await request(app)
        .post(`/api/v1/events/${event.id}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
    });
  });
});

