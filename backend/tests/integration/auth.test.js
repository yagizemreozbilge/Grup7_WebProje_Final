const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const { User, Department, sequelize } = require('../../src/models');
const { generateRefreshToken } = require('../../src/utils/jwt');

describe('Auth API (integration)', () => {
    let department;
    let verifiedUser;

    beforeAll(async() => {
        await sequelize.sync({ force: true });
    });

    beforeEach(async() => {
        await sequelize.sync({ force: true });

        department = await Department.create({
            name: 'Engineering',
            code: 'ENG',
            faculty: 'Engineering'
        });

        verifiedUser = await User.create({
            email: 'verified@test.edu',
            password_hash: await bcrypt.hash('Password123', 10),
            role: 'student',
            full_name: 'Verified User',
            is_verified: true
        });
    });

    it('POST /auth/register - success', async() => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: 'newstudent@test.edu',
                password: 'Password123',
                full_name: 'New Student',
                role: 'student',
                student_number: 'STU123',
                department_id: department.id
            });

        expect(res.status).toBe(201);
        expect(res.body.user.email).toBe('newstudent@test.edu');
    });

    it('POST /auth/register - duplicate email (400)', async() => {
        await User.create({
            email: 'dup@test.edu',
            password_hash: await bcrypt.hash('Password123', 10),
            role: 'student',
            full_name: 'Dup User',
            is_verified: true
        });

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: 'dup@test.edu',
                password: 'Password123',
                full_name: 'Dup User 2',
                role: 'student',
                student_number: 'STU555',
                department_id: department.id
            });

        expect(res.status).toBe(400);
    });

    it('POST /auth/login - success', async() => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'verified@test.edu', password: 'Password123' });

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.email).toBe('verified@test.edu');
    });

    it('POST /auth/login - unverified email (401)', async() => {
        await User.create({
            email: 'pending@test.edu',
            password_hash: await bcrypt.hash('Password123', 10),
            role: 'student',
            full_name: 'Pending User',
            is_verified: false
        });

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'pending@test.edu', password: 'Password123' });

        expect(res.status).toBe(401);
    });

    it('POST /auth/refresh - success', async() => {
        const refreshToken = generateRefreshToken({
            id: verifiedUser.id,
            email: verifiedUser.email,
            role: verifiedUser.role
        });
        verifiedUser.refresh_token = refreshToken;
        await verifiedUser.save();

        const res = await request(app)
            .post('/api/v1/auth/refresh')
            .send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeDefined();
    });

    it('POST /auth/logout - success', async() => {
        const login = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'verified@test.edu', password: 'Password123' });

        const res = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${login.body.accessToken}`);

        expect(res.status).toBe(204);
    });
});