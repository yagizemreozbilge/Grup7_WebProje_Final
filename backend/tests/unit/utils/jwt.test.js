const jwt = require('jsonwebtoken');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} = require('../../../src/utils/jwt');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('JWT Utils', () => {
    const mockPayload = {
        id: 'user-id',
        email: 'test@test.com',
        role: 'student'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    });

    describe('generateAccessToken', () => {
        it('should generate access token with correct payload and expiry', () => {
            jwt.sign.mockReturnValue('mock-access-token');

            const token = generateAccessToken(mockPayload);

            expect(jwt.sign).toHaveBeenCalledWith(
                mockPayload,
                'test-secret', { expiresIn: '15m' }
            );
            expect(token).toBe('mock-access-token');
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate refresh token with correct payload and expiry', () => {
            jwt.sign.mockReturnValue('mock-refresh-token');

            const token = generateRefreshToken(mockPayload);

            expect(jwt.sign).toHaveBeenCalledWith(
                mockPayload,
                'test-refresh-secret', { expiresIn: '7d' }
            );
            expect(token).toBe('mock-refresh-token');
        });
    });

    describe('verifyAccessToken', () => {
        it('should verify valid access token', () => {
            jwt.verify.mockReturnValue(mockPayload);

            const decoded = verifyAccessToken('valid-token');

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
            expect(decoded).toEqual(mockPayload);
        });

        it('should throw error for invalid access token', () => {
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            expect(() => verifyAccessToken('invalid-token')).toThrow('Invalid or expired access token');
        });
    });

    describe('verifyRefreshToken', () => {
        it('should verify valid refresh token', () => {
            jwt.verify.mockReturnValue(mockPayload);

            const decoded = verifyRefreshToken('valid-token');

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-refresh-secret');
            expect(decoded).toEqual(mockPayload);
        });

        it('should throw error for invalid refresh token', () => {
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            expect(() => verifyRefreshToken('invalid-token')).toThrow('Invalid or expired refresh token');
        });
    });
});