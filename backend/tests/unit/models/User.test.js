const bcrypt = require('bcrypt');
const { User, sequelize } = require('../../../src/models');

describe('User Model', () => {
    beforeAll(async() => {
        await sequelize.sync({ force: true });
    });

    afterAll(async() => {
        await sequelize.close();
    });

    beforeEach(async() => {
        await User.destroy({ where: {}, force: true });
    });

    describe('comparePassword', () => {
        it('should compare password correctly', async() => {
            const hashedPassword = await bcrypt.hash('Password123', 10);
            const user = await User.create({
                email: 'test@test.com',
                password_hash: hashedPassword,
                role: 'student',
                is_verified: true
            });

            const result = await user.comparePassword('Password123');

            expect(result).toBe(true);
        });

        it('should return false for incorrect password', async() => {
            const hashedPassword = await bcrypt.hash('Password123', 10);
            const user = await User.create({
                email: 'test@test.com',
                password_hash: hashedPassword,
                role: 'student',
                is_verified: true
            });

            const result = await user.comparePassword('WrongPassword');

            expect(result).toBe(false);
        });
    });

    describe('Model Creation', () => {
        it('should create user with required fields', async() => {
            const user = await User.create({
                email: 'newuser@test.com',
                password_hash: 'hashedpassword',
                role: 'student'
            });

            expect(user.id).toBeDefined();
            expect(user.email).toBe('newuser@test.com');
            expect(user.role).toBe('student');
            expect(user.is_verified).toBe(false);
        });

        it('should enforce unique email constraint', async() => {
            await User.create({
                email: 'duplicate@test.com',
                password_hash: 'hashedpassword',
                role: 'student'
            });

            await expect(
                User.create({
                    email: 'duplicate@test.com',
                    password_hash: 'hashedpassword',
                    role: 'student'
                })
            ).rejects.toThrow();
        });
    });
});
