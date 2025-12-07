const request = require('supertest');
const app = require('../../src/app');
const { User, Student, Faculty, Department, sequelize } = require('../../src/models');
const bcrypt = require('bcrypt');

describe('Authentication Endpoints - Integration Tests', () => {
    let testDepartment;
    let testUser;
    let accessToken;

    beforeAll(async() => {
        // Sync database
        await sequelize.sync({ force: true });

        testDepartment = await Department.create({
            name: 'Test Department',
            code: 'TEST',
            faculty: 'Engineering'
        });
    });

    afterAll(async() => {
        await sequelize.close();
    });

    beforeEach(async() => {
        // Clean tables
        await User.destroy({ where: {}, force: true });
        await Student.destroy({ where: {}, force: true });
        await Faculty.destroy({ where: {}, force: true });
        const passwordHash = await bcrypt.hash('Password123', 10);
        testUser = await User.create({
            email: 'test@test.com',
            password_hash: passwordHash,
            role: 'student',
            full_name: 'Test User',
            is_verified: true
        });
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new student (201)', async() => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'newstudent@test.com',
                    password: 'Password123',
                    full_name: 'New Student',
                    role: 'student',
                    student_number: 'STU001',
                    department_id: testDepartment.id
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe('newstudent@test.com');
            expect(response.body.user.role).toBe('student');
        });

        it('should register a new faculty (201)', async() => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'newfaculty@test.com',
                    password: 'Password123',
                    full_name: 'New Faculty',
                    role: 'faculty',
                    employee_number: 'EMP001',
                    title: 'Professor',
                    department_id: testDepartment.id
                });

            expect(response.status).toBe(201);
            expect(response.body.user.role).toBe('faculty');
        });

        it('should reject duplicate email (409)', async() => {
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'duplicate@test.com',
                    password: 'Password123',
                    role: 'student',
                    student_number: 'STU002',
                    department_id: testDepartment.id
                });

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'duplicate@test.com',
                    password: 'Password123',
                    role: 'student',
                    student_number: 'STU003',
                    department_id: testDepartment.id
                });

            expect(response.status).toBe(409);
        });

        it('should reject invalid data (400)', async() => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'weak',
                    role: 'student'
                });

            expect(response.status).toBe(400);
        });

        it('should reject missing required fields (400)', async() => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'missing@test.com',
                    password: 'Password123',
                    role: 'student'
                        // Missing student_number and department_id
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/auth/verify-email/:token', () => {
        it('should verify email with valid token (200)', async() => {
            const user = await User.create({
                email: 'verify@test.com',
                password_hash: await bcrypt.hash('Password123', 10),
                role: 'student',
                is_verified: false,
                verification_token: 'valid-token',
                verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            const response = await request(app)
                .post('/api/v1/auth/verify-email/valid-token');

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('verified');

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.is_verified).toBe(true);
        });

        it('should reject invalid token (400)', async() => {
            const response = await request(app)
                .post('/api/v1/auth/verify-email/invalid-token');

            expect(response.status).toBe(400);
        });

        it('should reject expired token (400)', async() => {
            const user = await User.create({
                email: 'expired@test.com',
                password_hash: await bcrypt.hash('Password123', 10),
                role: 'student',
                is_verified: false,
                verification_token: 'expired-token',
                verification_token_expires: new Date(Date.now() - 1000)
            });

            const response = await request(app)
                .post('/api/v1/auth/verify-email/expired-token');

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login with valid credentials (200)', async() => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'Password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('successful');
            expect(response.body.user).toBeDefined();
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.user.email).toBe('test@test.com');

            accessToken = response.body.accessToken;
        });

        it('should reject invalid credentials (401)', async() => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'WrongPassword'
                });

            expect(response.status).toBe(401);
        });

        it('should reject unverified email (401)', async() => {
            const unverifiedUser = await User.create({
                email: 'unverified@test.com',
                password_hash: await bcrypt.hash('Password123', 10),
                role: 'student',
                is_verified: false
            });

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'unverified@test.com',
                    password: 'Password123'
                });

            expect(response.status).toBe(401);
        });

        it('should include token in response', async() => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'Password123'
                });

            expect(response.body.accessToken).toBeDefined();
            expect(typeof response.body.accessToken).toBe('string');
        });
    });

    describe('POST /api/v1/auth/refresh', () => {
        it('should refresh access token with valid refresh token (200)', async() => {
            const { generateRefreshToken } = require('../../src/utils/jwt');
            const refreshToken = generateRefreshToken({ id: testUser.id, email: testUser.email, role: testUser.role });

            testUser.refresh_token = refreshToken;
            await testUser.save();

            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken });

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBeDefined();
        });

        it('should reject invalid refresh token (401)', async() => {
            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'invalid-token' });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should logout successfully (204)', async() => {
            // First login to get token
            const loginResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'Password123'
                });

            const token = loginResponse.body.accessToken;

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(204);
        });

        it('should require authentication (401)', async() => {
            const response = await request(app)
                .post('/api/v1/auth/logout');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/auth/forgot-password', () => {
        it('should send reset email (200)', async() => {
            // Mock email service
            const emailService = require('../../src/services/emailService');
            jest.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(true);

            const response = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({ email: 'test@test.com' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBeDefined();
        });

        it('should reject invalid email format (400)', async() => {
            const response = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({ email: 'invalid-email' });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/auth/reset-password/:token', () => {
        it('should reset password with valid token (200)', async() => {
            const user = await User.create({
                email: 'reset@test.com',
                password_hash: await bcrypt.hash('OldPassword123', 10),
                role: 'student',
                is_verified: true,
                reset_password_token: 'valid-reset-token',
                reset_password_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            const response = await request(app)
                .post('/api/v1/auth/reset-password/valid-reset-token')
                .send({ password: 'NewPassword123' });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('successfully');
        });

        it('should reject invalid token (400)', async() => {
            const response = await request(app)
                .post('/api/v1/auth/reset-password/invalid-token')
                .send({ password: 'NewPassword123' });

            expect(response.status).toBe(400);
        });

        it('should reject weak password (400)', async() => {
            const user = await User.create({
                email: 'weak@test.com',
                password_hash: await bcrypt.hash('OldPassword123', 10),
                role: 'student',
                is_verified: true,
                reset_password_token: 'valid-token',
                reset_password_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            const response = await request(app)
                .post('/api/v1/auth/reset-password/valid-token')
                .send({ password: 'weak' });

            expect(response.status).toBe(400);
        });
    });
});