// ============================================================================
// TWO FACTOR CONTROLLER TESTS
// ============================================================================
jest.mock('../../../src/services/twoFactorService');
jest.mock('../../../src/prisma', () => ({
    user: {
        findUnique: jest.fn(),
        update: jest.fn()
    }
}));

const twoFactorController = require('../../../src/controllers/twoFactorController');
const TwoFactorService = require('../../../src/services/twoFactorService');
const prisma = require('../../../src/prisma');

describe('Two Factor Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { id: 'user123' },
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('generateSecret', () => {
        it('should generate secret successfully (200)', async () => {
            const mockUser = { id: 'user123', email: 'user@test.edu' };
            const mockSecret = { base32: 'SECRET123' };
            const mockQrCode = 'data:image/png;base64,...';

            prisma.user.findUnique.mockResolvedValue(mockUser);
            TwoFactorService.generateSecret.mockReturnValue(mockSecret);
            TwoFactorService.generateQRCode.mockResolvedValue(mockQrCode);
            prisma.user.update.mockResolvedValue(mockUser);

            await twoFactorController.generateSecret(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    secret: 'SECRET123',
                    qrCode: mockQrCode,
                    manualEntryKey: 'SECRET123'
                }
            });
        });

        it('should return 404 if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await twoFactorController.generateSecret(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not found'
            });
        });

        it('should handle database error', async () => {
            const error = new Error('DB Error');
            prisma.user.findUnique.mockRejectedValue(error);

            await twoFactorController.generateSecret(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('verifyAndEnable', () => {
        it('should verify and enable 2FA successfully (200)', async () => {
            req.body = { token: '123456' };
            const mockUser = {
                id: 'user123',
                twoFactorSecret: 'SECRET123'
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);
            TwoFactorService.verifyToken.mockReturnValue(true);
            TwoFactorService.enable2FA.mockResolvedValue();

            await twoFactorController.verifyAndEnable(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: '2FA enabled successfully'
            });
        });

        it('should return 400 if token missing', async () => {
            req.body = {};

            await twoFactorController.verifyAndEnable(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Token is required'
            });
        });

        it('should return 400 if secret not found', async () => {
            req.body = { token: '123456' };
            prisma.user.findUnique.mockResolvedValue({
                id: 'user123',
                twoFactorSecret: null
            });

            await twoFactorController.verifyAndEnable(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: '2FA secret not found. Please generate first.'
            });
        });

        it('should return 400 if user not found', async () => {
            req.body = { token: '123456' };
            prisma.user.findUnique.mockResolvedValue(null);

            await twoFactorController.verifyAndEnable(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: '2FA secret not found. Please generate first.'
            });
        });

        it('should return 400 if token invalid', async () => {
            req.body = { token: '123456' };
            const mockUser = {
                id: 'user123',
                twoFactorSecret: 'SECRET123'
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);
            TwoFactorService.verifyToken.mockReturnValue(false);

            await twoFactorController.verifyAndEnable(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid token'
            });
        });

        it('should handle database error', async () => {
            req.body = { token: '123456' };
            const error = new Error('DB Error');
            prisma.user.findUnique.mockRejectedValue(error);

            await twoFactorController.verifyAndEnable(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('disable', () => {
        it('should disable 2FA successfully (200)', async () => {
            TwoFactorService.disable2FA.mockResolvedValue();

            await twoFactorController.disable(req, res, next);

            expect(TwoFactorService.disable2FA).toHaveBeenCalledWith('user123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: '2FA disabled successfully'
            });
        });

        it('should handle service error', async () => {
            const error = new Error('Service Error');
            TwoFactorService.disable2FA.mockRejectedValue(error);

            await twoFactorController.disable(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('verifyToken', () => {
        it('should verify token successfully (200)', async () => {
            req.body = { userId: 'user123', token: '123456' };
            const mockUser = {
                id: 'user123',
                twoFactorSecret: 'SECRET123',
                twoFactorEnabled: true
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);
            TwoFactorService.verifyToken.mockReturnValue(true);

            await twoFactorController.verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Token verified successfully'
            });
        });

        it('should return 400 if userId or token missing', async () => {
            req.body = { userId: 'user123' };

            await twoFactorController.verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'UserId and token are required'
            });
        });

        it('should return 400 if 2FA not enabled', async () => {
            req.body = { userId: 'user123', token: '123456' };
            prisma.user.findUnique.mockResolvedValue({
                id: 'user123',
                twoFactorEnabled: false
            });

            await twoFactorController.verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: '2FA is not enabled for this user'
            });
        });

        it('should return 400 if user not found', async () => {
            req.body = { userId: 'user123', token: '123456' };
            prisma.user.findUnique.mockResolvedValue(null);

            await twoFactorController.verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: '2FA is not enabled for this user'
            });
        });

        it('should return 400 if token invalid', async () => {
            req.body = { userId: 'user123', token: '123456' };
            const mockUser = {
                id: 'user123',
                twoFactorSecret: 'SECRET123',
                twoFactorEnabled: true
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);
            TwoFactorService.verifyToken.mockReturnValue(false);

            await twoFactorController.verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid token'
            });
        });

        it('should handle database error', async () => {
            req.body = { userId: 'user123', token: '123456' };
            const error = new Error('DB Error');
            prisma.user.findUnique.mockRejectedValue(error);

            await twoFactorController.verifyToken(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});

