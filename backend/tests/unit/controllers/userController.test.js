const userController = require('../../../src/controllers/userController');
const userService = require('../../../src/services/userService');

jest.mock('../../../src/services/userService');

describe('User Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: { id: 'user-id' },
            body: {},
            query: {},
            file: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getCurrentUser', () => {
        it('should get current user successfully', async() => {
            const mockUser = { id: 'user-id', email: 'test@test.com', full_name: 'Test User' };
            userService.getCurrentUser.mockResolvedValue(mockUser);

            await userController.getCurrentUser(req, res, next);

            expect(userService.getCurrentUser).toHaveBeenCalledWith('user-id');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockUser);
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next with error on failure', async() => {
            const error = new Error('User not found');
            userService.getCurrentUser.mockRejectedValue(error);

            await userController.getCurrentUser(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('updateProfile', () => {
        it('should update profile successfully', async() => {
            const mockUser = { id: 'user-id', full_name: 'Updated Name', phone: '+905551234567' };
            req.body = { full_name: 'Updated Name', phone: '+905551234567' };
            userService.updateProfile.mockResolvedValue(mockUser);

            await userController.updateProfile(req, res, next);

            expect(userService.updateProfile).toHaveBeenCalledWith('user-id', req.body);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Profile updated successfully',
                user: mockUser
            });
        });
    });

    describe('uploadProfilePicture', () => {
        it('should upload profile picture successfully', async() => {
            req.file = { filename: 'profile-123.jpg' };
            userService.updateProfilePicture.mockResolvedValue('/uploads/profile-123.jpg');

            await userController.uploadProfilePicture(req, res, next);

            expect(userService.updateProfilePicture).toHaveBeenCalledWith('user-id', '/uploads/profile-123.jpg');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Profile picture uploaded successfully',
                profilePictureUrl: '/uploads/profile-123.jpg'
            });
        });

        it('should return 400 if no file uploaded', async() => {
            req.file = null;

            await userController.uploadProfilePicture(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
            expect(userService.updateProfilePicture).not.toHaveBeenCalled();
        });
    });

    describe('getAllUsers', () => {
        it('should get all users with pagination', async() => {
            const mockResult = {
                users: [{ id: 'user1' }, { id: 'user2' }],
                pagination: { page: 1, limit: 10, total: 2, pages: 1 }
            };
            req.query = { page: '1', limit: '10' };
            req.user.role = 'admin';
            userService.getAllUsers.mockResolvedValue(mockResult);

            await userController.getAllUsers(req, res, next);

            expect(userService.getAllUsers).toHaveBeenCalledWith({
                page: '1',
                limit: '10',
                role: undefined,
                department_id: undefined,
                search: undefined
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it('should support filtering by role', async() => {
            req.query = { role: 'student' };
            req.user.role = 'admin';
            userService.getAllUsers.mockResolvedValue({ users: [], pagination: {} });

            await userController.getAllUsers(req, res, next);

            expect(userService.getAllUsers).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'student' })
            );
        });
    });
});