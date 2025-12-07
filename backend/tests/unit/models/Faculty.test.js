const { Faculty, User, Department, sequelize } = require('../../../src/models');
const bcrypt = require('bcrypt');

describe('Faculty Model', () => {
    let testUser;
    let testDepartment;

    beforeAll(async() => {
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
        await Faculty.destroy({ where: {}, force: true });
        await User.destroy({ where: {}, force: true });

        const passwordHash = await bcrypt.hash('Password123', 10);
        testUser = await User.create({
            email: 'faculty@test.com',
            password_hash: passwordHash,
            role: 'faculty',
            is_verified: true
        });
    });

    describe('create', () => {
        it('should create a faculty member with valid data', async() => {
            const faculty = await Faculty.create({
                user_id: testUser.id,
                employee_number: 'EMP001',
                title: 'Professor',
                department_id: testDepartment.id
            });

            expect(faculty).toBeDefined();
            expect(faculty.id).toBeDefined();
            expect(faculty.user_id).toBe(testUser.id);
            expect(faculty.employee_number).toBe('EMP001');
            expect(faculty.title).toBe('Professor');
            expect(faculty.department_id).toBe(testDepartment.id);
        });

        it('should reject duplicate employee number', async() => {
            await Faculty.create({
                user_id: testUser.id,
                employee_number: 'EMP001',
                title: 'Professor',
                department_id: testDepartment.id
            });

            const passwordHash2 = await bcrypt.hash('Password123', 10);
            const user2 = await User.create({
                email: 'faculty2@test.com',
                password_hash: passwordHash2,
                role: 'faculty',
                is_verified: true
            });

            await expect(Faculty.create({
                user_id: user2.id,
                employee_number: 'EMP001',
                title: 'Associate Professor',
                department_id: testDepartment.id
            })).rejects.toThrow();
        });

        it('should reject missing required fields', async() => {
            await expect(Faculty.create({
                user_id: testUser.id,
                // Missing employee_number, title, department_id
            })).rejects.toThrow();
        });
    });

    describe('associations', () => {
        it('should belong to user', async() => {
            const faculty = await Faculty.create({
                user_id: testUser.id,
                employee_number: 'EMP002',
                title: 'Assistant Professor',
                department_id: testDepartment.id
            });

            expect(faculty.associate).toBeDefined();
        });
    });
});