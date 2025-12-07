const { authenticate } = require('../../../src/middleware/auth');
const { verifyAccessToken } = require('../../../src/utils/jwt');
const { User } = require('../../../src/models');

jest.mock('../../../src/utils/jwt');
jest.mock('../../../models');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            user: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('authenticate', () => {
        it('should authenticate user with valid token', async() => {
            const mockUser = {
                id: 'user-id',
                email: 'test@test.com',
                role: 'student'
            };

            req.headers.authorization = 'Bearer valid-token';
            verifyAccessToken.mockReturnValue({ id: 'user-id', email: 'test@test.com', role: 'student' });
            User.findByPk = jest.fn().mockResolvedValue(mockUser);

            await authenticate(req, res, next);

            expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
            expect(User.findByPk).toHaveBeenCalledWith('user-id');
            expect(req.user).toEqual({
                id: 'user-id',
                email: 'test@test.com',
                role: 'student'
            });
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 401 if no token provided', async() => {
            req.headers.authorization = null;

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token format is invalid', async() => {
            req.headers.authorization = 'InvalidFormat token';

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token is invalid', async() => {
            req.headers.authorization = 'Bearer invalid-token';
            verifyAccessToken.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if user not found', async() => {
            req.headers.authorization = 'Bearer valid-token';
            verifyAccessToken.mockReturnValue({ id: 'user-id', email: 'test@test.com', role: 'student' });
            User.findByPk = jest.fn().mockResolvedValue(null);

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
            expect(next).not.toHaveBeenCalled();
        });
    });
});