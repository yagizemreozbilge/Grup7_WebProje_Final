const jwt = require('jsonwebtoken');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} = require('../../../src/utils/jwt');

describe('JWT Utils', () => {
    const mockPayload = { userId: '123', email: 'test@test.com' };

    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
        delete process.env.JWT_REFRESH_SECRET;
    });

    describe('generateAccessToken', () => {
        it('should generate a valid access token', () => {
            const token = generateAccessToken(mockPayload);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            expect(decoded.userId).toBe(mockPayload.userId);
            expect(decoded.email).toBe(mockPayload.email);
        });

        it('should generate token with 15 minute expiration', () => {
            const token = generateAccessToken(mockPayload);
            const decoded = jwt.decode(token);

            expect(decoded.exp).toBeDefined();
            const expirationTime = decoded.exp - decoded.iat;
            expect(expirationTime).toBe(15 * 60); // 15 minutes in seconds
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a valid refresh token', () => {
            const token = generateRefreshToken(mockPayload);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            expect(decoded.userId).toBe(mockPayload.userId);
            expect(decoded.email).toBe(mockPayload.email);
        });

        it('should generate token with 7 day expiration', () => {
            const token = generateRefreshToken(mockPayload);
            const decoded = jwt.decode(token);

            expect(decoded.exp).toBeDefined();
            const expirationTime = decoded.exp - decoded.iat;
            expect(expirationTime).toBe(7 * 24 * 60 * 60); // 7 days in seconds
        });
    });

    describe('verifyAccessToken', () => {
        it('should verify a valid access token', () => {
            const token = generateAccessToken(mockPayload);
            const decoded = verifyAccessToken(token);

            expect(decoded.userId).toBe(mockPayload.userId);
            expect(decoded.email).toBe(mockPayload.email);
        });

        it('should throw error for invalid token', () => {
            expect(() => {
                verifyAccessToken('invalid-token');
            }).toThrow('Invalid or expired access token');
        });

        it('should throw error for expired token', () => {
            const expiredToken = jwt.sign(mockPayload, process.env.JWT_SECRET, {
                expiresIn: '-1h' // Expired 1 hour ago
            });

            expect(() => {
                verifyAccessToken(expiredToken);
            }).toThrow('Invalid or expired access token');
        });

        it('should throw error for token signed with wrong secret', () => {
            const wrongToken = jwt.sign(mockPayload, 'wrong-secret');

            expect(() => {
                verifyAccessToken(wrongToken);
            }).toThrow('Invalid or expired access token');
        });
    });

    describe('verifyRefreshToken', () => {
        it('should verify a valid refresh token', () => {
            const token = generateRefreshToken(mockPayload);
            const decoded = verifyRefreshToken(token);

            expect(decoded.userId).toBe(mockPayload.userId);
            expect(decoded.email).toBe(mockPayload.email);
        });

        it('should throw error for invalid token', () => {
            expect(() => {
                verifyRefreshToken('invalid-token');
            }).toThrow('Invalid or expired refresh token');
        });

        it('should throw error for expired token', () => {
            const expiredToken = jwt.sign(mockPayload, process.env.JWT_REFRESH_SECRET, {
                expiresIn: '-1d' // Expired 1 day ago
            });

            expect(() => {
                verifyRefreshToken(expiredToken);
            }).toThrow('Invalid or expired refresh token');
        });

        it('should throw error for token signed with wrong secret', () => {
            const wrongToken = jwt.sign(mockPayload, 'wrong-secret');

            expect(() => {
                verifyRefreshToken(wrongToken);
            }).toThrow('Invalid or expired refresh token');
        });
    });
});

