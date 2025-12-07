const {
    validateEmail,
    validatePassword,
    validatePhone
} = require('../../../src/utils/validation');

describe('Validation Utils', () => {
    describe('validateEmail', () => {
        it('should validate correct email addresses', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name@domain.co.uk')).toBe(true);
            expect(validateEmail('user+tag@example.com')).toBe(true);
        });

        it('should reject invalid email addresses', () => {
            expect(validateEmail('invalid-email')).toBe(false);
            expect(validateEmail('@example.com')).toBe(false);
            expect(validateEmail('user@')).toBe(false);
            expect(validateEmail('user@domain')).toBe(false);
            expect(validateEmail('')).toBe(false);
        });
    });

    describe('validatePassword', () => {
        it('should validate strong passwords', () => {
            expect(validatePassword('Password123')).toBe(true);
            expect(validatePassword('MyP@ssw0rd')).toBe(true);
            expect(validatePassword('Test1234')).toBe(true);
        });

        it('should reject weak passwords', () => {
            expect(validatePassword('weak')).toBe(false);
            expect(validatePassword('password')).toBe(false); // no uppercase, no number
            expect(validatePassword('PASSWORD')).toBe(false); // no lowercase, no number
            expect(validatePassword('Password')).toBe(false); // no number
            expect(validatePassword('12345678')).toBe(false); // no letters
            expect(validatePassword('Pass1')).toBe(false); // too short
            expect(validatePassword('')).toBe(false);
        });
    });

    describe('validatePhone', () => {
        it('should validate correct phone numbers', () => {
            expect(validatePhone('+905551234567')).toBe(true);
            expect(validatePhone('05551234567')).toBe(true);
            expect(validatePhone('(555) 123-4567')).toBe(true);
            expect(validatePhone('555-123-4567')).toBe(true);
            expect(validatePhone('5551234567')).toBe(true);
        });

        it('should reject invalid phone numbers', () => {
            expect(validatePhone('123')).toBe(false); // too short
            expect(validatePhone('abc123')).toBe(false); // contains letters
            expect(validatePhone('')).toBe(false);
            expect(validatePhone('12345')).toBe(false); // too short
        });

        it('should accept phone numbers with spaces and dashes', () => {
            expect(validatePhone('555 123 4567')).toBe(true);
            expect(validatePhone('555-123-4567')).toBe(true);
            expect(validatePhone('(555) 123-4567')).toBe(true);
        });
    });
});