const { Student, User, Department, sequelize } = require('../../../src/models');
const bcrypt = require('bcrypt');

describe('Student Model', () => {
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
        await Student.destroy({ where: {}, force: true });
        await User.destroy({ where: {}, force: true });

        const passwordHash = await bcrypt.hash('Password123', 10);
        testUser = await User.create({
            email: 'student@test.com',
            password_hash: passwordHash,
            role: 'student',
            is_verified: true
        });
    });

    describe('create', () => {
        it('should create a student with valid data', async() => {
            const student = await Student.create({
                user_id: testUser.id,
                student_number: 'STU001',
                department_id: testDepartment.id
            });

            expect(student).toBeDefined();
            expect(student.id).toBeDefined();
            expect(student.user_id).toBe(testUser.id);
            expect(student.student_number).toBe('STU001');
            expect(student.department_id).toBe(testDepartment.id);
        });

        it('should reject duplicate student number', async() => {
            await Student.create({
                user_id: testUser.id,
                student_number: 'STU001',
                department_id: testDepartment.id
            });

            const passwordHash2 = await bcrypt.hash('Password123', 10);
            const user2 = await User.create({
                email: 'student2@test.com',
                password_hash: passwordHash2,
                role: 'student',
                is_verified: true
            });

            await expect(Student.create({
                user_id: user2.id,
                student_number: 'STU001',
                department_id: testDepartment.id
            })).rejects.toThrow();
        });

        it('should have default GPA and CGPA values', async() => {
            const student = await Student.create({
                user_id: testUser.id,
                student_number: 'STU002',
                department_id: testDepartment.id
            });

            expect(student.gpa).toBe('0.00');
            expect(student.cgpa).toBe('0.00');
        });
    });

    describe('associations', () => {
        it('should belong to user', async() => {
            const student = await Student.create({
                user_id: testUser.id,
                student_number: 'STU003',
                department_id: testDepartment.id
            });

            expect(student.associate).toBeDefined();
        });
    });
});
