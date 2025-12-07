const authController = require('../../../src/controllers/authController');
const authService = require('../../../src/services/authService');

jest.mock('../../../src/services/authService');

describe('Auth Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: {},
            cookies: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register user successfully', async() => {
            const mockUser = { id: 'user-id', email: 'test@test.com', role: 'student' };
            req.body = { email: 'test@test.com', password: 'Password123', role: 'student' };
            authService.register.mockResolvedValue(mockUser);

            await authController.register(req, res, next);

            expect(authService.register).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User registered successfully. Please check your email for verification.',
                user: mockUser
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next with error on failure', async() => {
            const error = new Error('Registration failed');
            req.body = { email: 'test@test.com', password: 'Password123' };
            authService.register.mockRejectedValue(error);

            await authController.register(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should login user successfully and set cookie', async() => {
            const mockResult = {
                user: { id: 'user-id', email: 'test@test.com' },
                accessToken: 'access-token',
                refreshToken: 'refresh-token'
            };
            req.body = { email: 'test@test.com', password: 'Password123' };
            authService.login.mockResolvedValue(mockResult);

            await authController.login(req, res, next);

            expect(authService.login).toHaveBeenCalledWith('test@test.com', 'Password123');
            expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.any(Object));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Login successful',
                user: mockResult.user,
                accessToken: 'access-token'
            });
        });
    });

    describe('logout', () => {
        it('should logout user successfully', async() => {
            req.user = { id: 'user-id' };
            authService.logout.mockResolvedValue();

            await authController.logout(req, res, next);

            expect(authService.logout).toHaveBeenCalledWith('user-id');
            expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });

    describe('refresh', () => {
        it('should refresh token from cookie', async() => {
            req.cookies.refreshToken = 'refresh-token';
            authService.refreshToken.mockResolvedValue({ accessToken: 'new-access-token' });

            await authController.refresh(req, res, next);

            expect(authService.refreshToken).toHaveBeenCalledWith('refresh-token');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ accessToken: 'new-access-token' });
        });

        it('should refresh token from body if cookie not present', async() => {
            req.body.refreshToken = 'refresh-token';
            authService.refreshToken.mockResolvedValue({ accessToken: 'new-access-token' });

            await authController.refresh(req, res, next);

            expect(authService.refreshToken).toHaveBeenCalledWith('refresh-token');
        });

        it('should return 401 if no refresh token', async() => {
            await authController.refresh(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token required' });
            expect(authService.refreshToken).not.toHaveBeenCalled();
        });
    });

    describe('verifyEmail', () => {
        it('should verify email successfully', async() => {
            req.params.token = 'verification-token';
            authService.verifyEmail.mockResolvedValue();

            await authController.verifyEmail(req, res, next);

            expect(authService.verifyEmail).toHaveBeenCalledWith('verification-token');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email verified successfully' });
        });
    });

    describe('forgotPassword', () => {
        it('should send password reset email', async() => {
            req.body.email = 'test@test.com';
            authService.forgotPassword.mockResolvedValue();

            await authController.forgotPassword(req, res, next);

            expect(authService.forgotPassword).toHaveBeenCalledWith('test@test.com');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        });
    });

    describe('resetPassword', () => {
        it('should reset password successfully', async() => {
            req.params.token = 'reset-token';
            req.body.password = 'NewPassword123';
            authService.resetPassword.mockResolvedValue();

            await authController.resetPassword(req, res, next);

            expect(authService.resetPassword).toHaveBeenCalledWith('reset-token', 'NewPassword123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
        });
    });
});