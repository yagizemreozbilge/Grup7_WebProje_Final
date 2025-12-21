const emailService = require('../../src/services/emailService');
const nodemailer = require('nodemailer');

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: (...args) => mockSendMail(...args)
    })
}));

describe('EmailService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSendMail.mockResolvedValue({ messageId: 'test-id' });
    });

    test('sendVerificationEmail should return true on success', async () => {
        const result = await emailService.sendVerificationEmail('test@test.com', 'token123');
        expect(result).toBe(true);
    });

    test('sendVerificationEmail should return false on error', async () => {
        mockSendMail.mockRejectedValue(new Error('SMTP Error'));
        const result = await emailService.sendVerificationEmail('test@test.com', 'token123');
        expect(result).toBe(false);
    });

    test('sendPasswordResetEmail should return true on success', async () => {
        const result = await emailService.sendPasswordResetEmail('test@test.com', 'reset-token');
        expect(result).toBe(true);
    });

    test('sendPasswordResetEmail should return false on error', async () => {
        mockSendMail.mockRejectedValue(new Error('SMTP Error'));
        const result = await emailService.sendPasswordResetEmail('test@test.com', 'reset-token');
        expect(result).toBe(false);
    });
});

