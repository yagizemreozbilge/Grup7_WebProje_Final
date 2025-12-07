// Mock dependencies BEFORE requiring the service
jest.mock('../../../src/models', () => ({
    User: {
        findByPk: jest.fn(),
        findAndCountAll: jest.fn()
    },
    Student: {},
    Faculty: {},
    Department: {}
}));

// Now require the service and dependencies
const userService = require('../../../src/services/userService');
const { User } = require('../../../src/models');
const { Op } = require('sequelize');

describe('User Service - Unit Tests (Mocked)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCurrentUser', () => {
        it('should get current user with student info', async() => {
            const mockUser = {
                id: 'user-id',
                email: 'testuser@test.com',
                toJSON: () => ({
                    id: 'user-id',
                    email: 'testuser@test.com',
                    password_hash: 'hash',
                    refresh_token: 'token',
                    verification_token: 'v-token',
                    reset_password_token: 'r-token',
                    student: {
                        student_number: 'STU999',
                        department: { name: 'Test Department' }
                    }
                })
            };
            User.findByPk.mockResolvedValue(mockUser);

            const user = await userService.getCurrentUser('user-id');

            expect(User.findByPk).toHaveBeenCalledWith('user-id', {
                include: expect.any(Array)
            });
            expect(user.id).toBe('user-id');
            expect(user.email).toBe('testuser@test.com');
            expect(user.password_hash).toBeUndefined();
            expect(user.student).toBeDefined();
        });

        it('should get current user with faculty info', async() => {
            const mockUser = {
                id: 'faculty-id',
                email: 'facultyuser@test.com',
                toJSON: () => ({
                    id: 'faculty-id',
                    email: 'facultyuser@test.com',
                    password_hash: 'hash',
                    refresh_token: 'token',
                    verification_token: 'v-token',
                    reset_password_token: 'r-token',
                    faculty: {
                        employee_number: 'FAC002',
                        department: { name: 'Test Department' }
                    }
                })
            };
            User.findByPk.mockResolvedValue(mockUser);

            const user = await userService.getCurrentUser('faculty-id');

            expect(user.faculty).toBeDefined();
            expect(user.faculty.employee_number).toBe('FAC002');
        });

        it('should throw error for non-existent user', async() => {
            User.findByPk.mockResolvedValue(null);

            await expect(userService.getCurrentUser('non-existent-id')).rejects.toThrow('User not found');
        });
    });

    describe('updateProfile', () => {
        it('should update user profile', async() => {
            const mockUser = {
                id: 'user-id',
                full_name: 'Old Name',
                phone: '+905551234567',
                save: jest.fn().mockResolvedValue(true),
                toJSON: () => ({
                    id: 'user-id',
                    full_name: 'Updated Name',
                    phone: '+905559876543',
                    password_hash: 'hash',
                    refresh_token: 'token',
                    verification_token: 'v-token',
                    reset_password_token: 'r-token'
                })
            };
            User.findByPk.mockResolvedValue(mockUser);

            const updateData = {
                full_name: 'Updated Name',
                phone: '+905559876543'
            };

            const updatedUser = await userService.updateProfile('user-id', updateData);

            expect(User.findByPk).toHaveBeenCalledWith('user-id');
            expect(mockUser.full_name).toBe('Updated Name');
            expect(mockUser.phone).toBe('+905559876543');
            expect(mockUser.save).toHaveBeenCalled();
            expect(updatedUser.full_name).toBe('Updated Name');
        });

        it('should update only provided fields', async() => {
            const mockUser = {
                id: 'user-id',
                full_name: 'Test User',
                phone: '+905551234567',
                save: jest.fn().mockResolvedValue(true),
                toJSON: () => ({
                    id: 'user-id',
                    full_name: 'Only Name Updated',
                    phone: '+905551234567',
                    password_hash: 'hash',
                    refresh_token: 'token',
                    verification_token: 'v-token',
                    reset_password_token: 'r-token'
                })
            };
            User.findByPk.mockResolvedValue(mockUser);

            const updateData = {
                full_name: 'Only Name Updated'
            };

            const updatedUser = await userService.updateProfile('user-id', updateData);

            expect(mockUser.full_name).toBe('Only Name Updated');
            expect(mockUser.phone).toBe('+905551234567'); // Unchanged
            expect(updatedUser.full_name).toBe('Only Name Updated');
        });

        it('should update only phone when full_name not provided', async() => {
            const mockUser = {
                id: 'user-id',
                full_name: 'Test User',
                phone: '+905551234567',
                save: jest.fn().mockResolvedValue(true),
                toJSON: () => ({
                    id: 'user-id',
                    full_name: 'Test User',
                    phone: '+905559999999',
                    password_hash: 'hash',
                    refresh_token: 'token',
                    verification_token: 'v-token',
                    reset_password_token: 'r-token'
                })
            };
            User.findByPk.mockResolvedValue(mockUser);

            const updateData = {
                phone: '+905559999999'
            };

            const updatedUser = await userService.updateProfile('user-id', updateData);

            expect(mockUser.phone).toBe('+905559999999');
            expect(mockUser.full_name).toBe('Test User'); // Unchanged
        });

        it('should handle empty update data', async() => {
            const mockUser = {
                id: 'user-id',
                full_name: 'Test User',
                phone: '+905551234567',
                save: jest.fn().mockResolvedValue(true),
                toJSON: () => ({
                    id: 'user-id',
                    full_name: 'Test User',
                    phone: '+905551234567',
                    password_hash: 'hash',
                    refresh_token: 'token',
                    verification_token: 'v-token',
                    reset_password_token: 'r-token'
                })
            };
            User.findByPk.mockResolvedValue(mockUser);

            const updateData = {};

            const updatedUser = await userService.updateProfile('user-id', updateData);

            expect(mockUser.full_name).toBe('Test User');
            expect(mockUser.phone).toBe('+905551234567');
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should throw error for non-existent user', async() => {
            User.findByPk.mockResolvedValue(null);

            await expect(userService.updateProfile('non-existent-id', { full_name: 'Test' })).rejects.toThrow('User not found');
        });
    });

    describe('updateProfilePicture', () => {
        it('should update profile picture URL', async() => {
            const mockUser = {
                id: 'user-id',
                profile_picture_url: null,
                save: jest.fn().mockResolvedValue(true)
            };
            User.findByPk.mockResolvedValue(mockUser);

            const filePath = '/uploads/profile-123.jpg';
            const url = await userService.updateProfilePicture('user-id', filePath);

            expect(User.findByPk).toHaveBeenCalledWith('user-id');
            expect(mockUser.profile_picture_url).toBe(filePath);
            expect(mockUser.save).toHaveBeenCalled();
            expect(url).toBe(filePath);
        });

        it('should throw error for non-existent user', async() => {
            User.findByPk.mockResolvedValue(null);

            await expect(userService.updateProfilePicture('non-existent-id', '/uploads/test.jpg')).rejects.toThrow('User not found');
        });
    });

    describe('getAllUsers', () => {
        it('should get all users with pagination', async() => {
            const mockUsers = [
                { id: 'user1', email: 'user1@test.com', toJSON: () => ({ id: 'user1', email: 'user1@test.com' }) },
                { id: 'user2', email: 'user2@test.com', toJSON: () => ({ id: 'user2', email: 'user2@test.com' }) }
            ];
            User.findAndCountAll.mockResolvedValue({
                count: 10,
                rows: mockUsers
            });

            const result = await userService.getAllUsers({ page: 1, limit: 2 });

            expect(User.findAndCountAll).toHaveBeenCalled();
            expect(result.users).toBeDefined();
            expect(result.users.length).toBe(2);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(2);
            expect(result.pagination.total).toBe(10);
        });

        it('should filter users by role', async() => {
            const mockUsers = [
                { id: 'user1', role: 'student', toJSON: () => ({ id: 'user1', role: 'student' }) }
            ];
            User.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: mockUsers
            });

            const result = await userService.getAllUsers({ role: 'student' });

            expect(User.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ role: 'student' })
                })
            );
            expect(result.users.every(u => u.role === 'student')).toBe(true);
        });

        it('should search users by email or name', async() => {
            const mockUsers = [
                { id: 'user1', email: 'testuser@test.com', toJSON: () => ({ id: 'user1', email: 'testuser@test.com' }) }
            ];
            User.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: mockUsers
            });

            const result = await userService.getAllUsers({ search: 'testuser' });

            expect(User.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        [Op.or]: expect.any(Array)
                    })
                })
            );
            expect(result.users.length).toBeGreaterThan(0);
        });

        it('should filter users by department_id', async() => {
            const mockUsers = [
                { id: 'user1', toJSON: () => ({ id: 'user1' }) }
            ];
            User.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: mockUsers
            });

            const result = await userService.getAllUsers({ department_id: 'dept-id' });

            expect(User.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            where: { department_id: 'dept-id' }
                        })
                    ])
                })
            );
            expect(result.users.length).toBeGreaterThan(0);
        });

        it('should handle pagination correctly', async() => {
            User.findAndCountAll
                .mockResolvedValueOnce({ count: 10, rows: [{ toJSON: () => ({ id: '1' }) }, { toJSON: () => ({ id: '2' }) }] })
                .mockResolvedValueOnce({ count: 10, rows: [{ toJSON: () => ({ id: '3' }) }, { toJSON: () => ({ id: '4' }) }] });

            const result1 = await userService.getAllUsers({ page: 1, limit: 2 });
            const result2 = await userService.getAllUsers({ page: 2, limit: 2 });

            expect(result1.pagination.page).toBe(1);
            expect(result2.pagination.page).toBe(2);
        });

        it('should handle getAllUsers with no filters', async() => {
            User.findAndCountAll.mockResolvedValue({
                count: 5,
                rows: []
            });

            const result = await userService.getAllUsers({});

            expect(result.users).toBeDefined();
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
        });

        it('should handle getAllUsers with combination of filters', async() => {
            User.findAndCountAll.mockResolvedValue({
                count: 2,
                rows: [
                    { toJSON: () => ({ id: '1', role: 'student' }) },
                    { toJSON: () => ({ id: '2', role: 'student' }) }
                ]
            });

            const result = await userService.getAllUsers({
                role: 'student',
                search: 'test',
                page: 1,
                limit: 5
            });

            expect(result.users).toBeDefined();
            expect(result.pagination.limit).toBe(5);
        });
    });
});