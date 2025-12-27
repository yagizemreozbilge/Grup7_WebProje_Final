// tests/integration/meals.test.js
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/prisma');

describe('Meals API Integration Tests', () => {
  let studentUser;
  let adminUser;
  let studentToken;
  let adminToken;
  let meal;

  beforeAll(async () => {
    await prisma.$transaction([
      prisma.mealReservation.deleteMany(),
      prisma.meal.deleteMany(),
      prisma.user.deleteMany()
    ]);
  });

  beforeEach(async () => {
    await prisma.mealReservation.deleteMany();
    await prisma.meal.deleteMany();
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

    meal = await prisma.meal.create({
      data: {
        date: new Date('2025-12-31'),
        mealType: 'LUNCH',
        menu: 'Test Menu',
        price: 15.00,
        availableCount: 100
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

  describe('GET /api/v1/meals', () => {
    it('should get meals successfully', async () => {
      const res = await request(app)
        .get('/api/v1/meals');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter meals by date', async () => {
      const res = await request(app)
        .get('/api/v1/meals?date=2025-12-31');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter meals by mealType', async () => {
      const res = await request(app)
        .get('/api/v1/meals?mealType=LUNCH');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/meals/:id/reserve', () => {
    it('should reserve meal successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/meals/${meal.id}/reserve`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent meal', async () => {
      const res = await request(app)
        .post('/api/v1/meals/non-existent-id/reserve')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post(`/api/v1/meals/${meal.id}/reserve`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/meals/my-reservations', () => {
    it('should get user reservations successfully', async () => {
      const res = await request(app)
        .get('/api/v1/meals/my-reservations')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/meals/my-reservations');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/meals', () => {
    it('should create meal successfully (admin only)', async () => {
      const res = await request(app)
        .post('/api/v1/meals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: '2025-12-31',
          mealType: 'DINNER',
          menu: 'New Menu',
          price: 20.00,
          availableCount: 50
        });

      expect(res.status).toBe(201);
      expect(res.body.data.menu).toBe('New Menu');
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/meals')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          date: '2025-12-31',
          mealType: 'DINNER',
          menu: 'New Menu',
          price: 20.00,
          availableCount: 50
        });

      expect(res.status).toBe(403);
    });
  });
});

