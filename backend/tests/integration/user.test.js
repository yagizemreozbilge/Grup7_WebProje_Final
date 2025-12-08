const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const { User, Student, Department, sequelize } = require('../../src/models');

describe('User API (integration)', () => {
    let department;
    let studentUser;
    let adminUser;
    let studentToken;
    let adminToken;

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

        studentUser = await User.create({
            email: 'student@test.edu',
            password_hash: await bcrypt.hash('Password123', 10),
            role: 'student',
            full_name: 'Student User',
            is_verified: true
        });

        await Student.create({
            user_id: studentUser.id,
            student_number: 'STU001',
            department_id: department.id
        });

        adminUser = await User.create({
            email: 'admin@test.edu',
            password_hash: await bcrypt.hash('Password123', 10),
            role: 'admin',
            full_name: 'Admin User',
            is_verified: true
        });

        const studentLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'student@test.edu', password: 'Password123' });
        studentToken = studentLogin.body.accessToken;

        const adminLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@test.edu', password: 'Password123' });
        adminToken = adminLogin.body.accessToken;
    });

    it('GET /users/me - success (with auth)', async() => {
        const res = await request(app)
            .get('/api/v1/users/me')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe('student@test.edu');
        expect(res.body).not.toHaveProperty('password_hash');
    });

    it('GET /users/me - unauthorized (401)', async() => {
        const res = await request(app).get('/api/v1/users/me');
        expect(res.status).toBe(401);
    });

    it('PUT /users/me - success', async() => {
        const res = await request(app)
            .put('/api/v1/users/me')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                full_name: 'Updated Name',
                phone: '(555) 123-4567'
            });

        expect(res.status).toBe(200);
        expect(res.body.user.full_name).toBe('Updated Name');
    });

    it('GET /users - admin only (403 for student)', async() => {
        const res = await request(app)
            .get('/api/v1/users')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(403);
    });

    it('GET /users - admin success', async() => {
        const res = await request(app)
            .get('/api/v1/users')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.users.length).toBeGreaterThan(0);
        expect(res.body.pagination.total).toBeGreaterThan(0);
    });
});