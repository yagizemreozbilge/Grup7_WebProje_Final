// tests/integration/wallet.test.js
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/prisma');

describe('Wallet API Integration Tests', () => {
  let studentUser;
  let studentToken;
  let wallet;

  beforeAll(async () => {
    await prisma.$transaction([
      prisma.transaction.deleteMany(),
      prisma.wallet.deleteMany(),
      prisma.student.deleteMany(),
      prisma.user.deleteMany()
    ]);
  });

  beforeEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.student.deleteMany();
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

    wallet = await prisma.wallet.create({
      data: {
        userId: studentUser.id,
        balance: 100.00
      }
    });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student@test.edu', password: 'Password123' });
    studentToken = studentLogin.body.data.accessToken;
  });

  describe('GET /api/v1/wallet/balance', () => {
    it('should get wallet balance successfully', async () => {
      const res = await request(app)
        .get('/api/v1/wallet/balance')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('balance');
      expect(res.body.data.balance).toBe(100.00);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/wallet/balance');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/wallet/topup', () => {
    it('should create topup session successfully', async () => {
      const res = await request(app)
        .post('/api/v1/wallet/topup')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 50 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('sessionId');
    });

    it('should return 400 if amount is missing', async () => {
      const res = await request(app)
        .post('/api/v1/wallet/topup')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/wallet/topup')
        .send({ amount: 50 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/wallet/transactions', () => {
    it('should get transactions successfully', async () => {
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'TOPUP',
          amount: 50.00,
          description: 'Test transaction'
        }
      });

      const res = await request(app)
        .get('/api/v1/wallet/transactions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });

    it('should filter transactions by type', async () => {
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'TOPUP',
          amount: 50.00,
          description: 'Test transaction'
        }
      });

      const res = await request(app)
        .get('/api/v1/wallet/transactions?type=TOPUP')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/wallet/transactions');

      expect(res.status).toBe(401);
    });
  });
});

