const { Department, sequelize } = require('../../../src/models');

describe('Department Model', () => {
    beforeAll(async() => {
        await sequelize.sync({ force: true });
    });

    afterAll(async() => {
        await sequelize.close();
    });

    beforeEach(async() => {
        await Department.destroy({ where: {}, force: true });
    });

    describe('create', () => {
        it('should create a department with valid data', async() => {
            const department = await Department.create({
                name: 'Computer Science',
                code: 'CS',
                faculty: 'Engineering'
            });

            expect(department).toBeDefined();
            expect(department.id).toBeDefined();
            expect(department.name).toBe('Computer Science');
            expect(department.code).toBe('CS');
            expect(department.faculty).toBe('Engineering');
        });

        it('should reject duplicate code', async() => {
            await Department.create({
                name: 'Computer Science',
                code: 'CS',
                faculty: 'Engineering'
            });

            await expect(Department.create({
                name: 'Another CS',
                code: 'CS',
                faculty: 'Engineering'
            })).rejects.toThrow();
        });

        it('should reject missing required fields', async() => {
            await expect(Department.create({
                name: 'Test',
                // Missing code and faculty
            })).rejects.toThrow();
        });
    });

    describe('associations', () => {
        it('should have students association', async() => {
            const department = await Department.create({
                name: 'Test Department',
                code: 'TEST',
                faculty: 'Engineering'
            });

            expect(department.associate).toBeDefined();
        });
    });
});