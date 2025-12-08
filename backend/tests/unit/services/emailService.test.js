const nodemailer = require('nodemailer');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../../src/services/emailService');

jest.mock('nodemailer');

describe('Email Service', () => {
    let mockTransporter;

    beforeEach(() => {
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue(true)
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);
        process.env.SMTP_USER = 'test@test.com';
        process.env.FRONTEND_URL = 'http://localhost:3000';
        jest.clearAllMocks();
    });

    describe('sendVerificationEmail', () => {
        it('should send verification email with correct parameters', async() => {
            const email = 'user@test.com';
            const token = 'verification-token';

            await sendVerificationEmail(email, token);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: 'test@test.com',
                    to: email,
                    subject: 'Email Verification - Campus Management System',
                    html: expect.stringContaining('verify-email/verification-token')
                })
            );
        });

        it('should include verification URL in email', async() => {
            const email = 'user@test.com';
            const token = 'test-token';

            await sendVerificationEmail(email, token);

            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.html).toContain('http://localhost:3000/verify-email/test-token');
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should send password reset email with correct parameters', async() => {
            const email = 'user@test.com';
            const token = 'reset-token';

            await sendPasswordResetEmail(email, token);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: 'test@test.com',
                    to: email,
                    subject: 'Password Reset - Campus Management System',
                    html: expect.stringContaining('reset-password/reset-token')
                })
            );
        });

        it('should include reset URL in email', async() => {
            const email = 'user@test.com';
            const token = 'test-reset-token';

            await sendPasswordResetEmail(email, token);

            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.html).toContain('http://localhost:3000/reset-password/test-reset-token');
        });

        it('should throw error if email sending fails', async() => {
            mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

            await expect(sendPasswordResetEmail('user@test.com', 'token')).rejects.toThrow('Failed to send password reset email');
        });
    });
});
