const userService = require('../../src/services/userService');

jest.mock('../../src/models', () => ({
    User: {
        findByPk: jest.fn(),
        findAndCountAll: jest.fn()
    },
    Student: {},
    Faculty: {},
    Department: {},
    Sequelize: {}
}));

const { User } = require('../../src/models');

describe('userService (unit)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('gets current user and strips sensitive fields', async() => {
        const mockUser = {
            id: 'u1',
            email: 'user@test.edu',
            password_hash: 'hash',
            refresh_token: 'rt',
            verification_token: 'vt',
            reset_password_token: 'rp',
            toJSON: jest.fn().mockReturnValue({
                id: 'u1',
                email: 'user@test.edu',
                role: 'student',
                password_hash: 'hash',
                refresh_token: 'rt',
                verification_token: 'vt',
                reset_password_token: 'rp'
            })
        };
        User.findByPk.mockResolvedValue(mockUser);

        const result = await userService.getCurrentUser('u1');

        expect(result.id).toBe('u1');
        expect(result).not.toHaveProperty('password_hash');
        expect(result).not.toHaveProperty('refresh_token');
        expect(mockUser.toJSON).toHaveBeenCalled();
    });

    it('updates profile fields and returns sanitized user', async() => {
        const mockUser = {
            id: 'u1',
            email: 'user@test.edu',
            full_name: 'Old',
            phone: '+111',
            save: jest.fn().mockResolvedValue(true),
            toJSON: jest.fn(function() {
                return {
                    id: this.id,
                    email: this.email,
                    full_name: this.full_name,
                    phone: this.phone,
                    password_hash: 'hash',
                    refresh_token: 'rt',
                    verification_token: 'vt',
                    reset_password_token: 'rp'
                };
            })
        };
        User.findByPk.mockResolvedValue(mockUser);

        const result = await userService.updateProfile('u1', {
            full_name: 'New Name',
            phone: '+905551234567'
        });

        expect(mockUser.save).toHaveBeenCalled();
        expect(result.full_name).toBe('New Name');
        expect(result.phone).toBe('+905551234567');
        expect(result).not.toHaveProperty('password_hash');
    });

    it('updates profile picture when user exists', async() => {
        const mockUser = {
            id: 'u1',
            profile_picture_url: null,
            save: jest.fn().mockResolvedValue(true)
        };
        User.findByPk.mockResolvedValue(mockUser);

        const path = await userService.updateProfilePicture('u1', '/uploads/pic.png');
        expect(mockUser.save).toHaveBeenCalled();
        expect(path).toBe('/uploads/pic.png');
    });

    it('throws when updating picture for missing user', async() => {
        User.findByPk.mockResolvedValue(null);
        await expect(
            userService.updateProfilePicture('missing', '/uploads/pic.png')
        ).rejects.toThrow('User not found');
    });

    it('lists users with pagination data', async() => {
        User.findAndCountAll.mockResolvedValue({
            count: 3,
            rows: [{
                toJSON: () => ({
                    id: 'u1',
                    email: 'u1@test.edu',
                    role: 'student',
                    password_hash: 'hash',
                    refresh_token: 'rt',
                    verification_token: 'vt',
                    reset_password_token: 'rp'
                })
            }]
        });

        const result = await userService.getAllUsers({ page: 1, limit: 2, role: 'student' });

        expect(User.findAndCountAll).toHaveBeenCalled();
        expect(result.users[0]).not.toHaveProperty('password_hash');
        expect(result.pagination.total).toBe(3);
        expect(result.pagination.limit).toBe(2);
    });

    it('lists users with department filter', async() => {
        User.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                toJSON: () => ({
                    id: 'u2',
                    email: 'u2@test.edu',
                    role: 'student'
                })
            }]
        });

        const result = await userService.getAllUsers({ department_id: 'dep-1' });

        expect(User.findAndCountAll).toHaveBeenCalled();
        expect(result.users[0].email).toBe('u2@test.edu');
    });

    it('lists users with search and role filter', async() => {
        User.findAndCountAll.mockResolvedValue({
            count: 2,
            rows: [{
                toJSON: () => ({
                    id: 'u3',
                    email: 'search@test.edu',
                    role: 'faculty'
                })
            }]
        });

        const result = await userService.getAllUsers({ search: 'search', role: 'faculty', page: 2, limit: 1 });

        expect(User.findAndCountAll).toHaveBeenCalled();
        expect(result.pagination.page).toBe(2);
        expect(result.pagination.limit).toBe(1);
    });
});