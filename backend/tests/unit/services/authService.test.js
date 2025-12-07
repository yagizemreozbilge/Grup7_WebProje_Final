// Mock dependencies BEFORE requiring the service
jest.mock('../../../src/models', () => ({
    User: {
        findOne: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn()
    },
    Student: {
        findOne: jest.fn(),
        create: jest.fn()
    },
    Faculty: {
        findOne: jest.fn(),
        create: jest.fn()
    },
    Department: {}
}));

jest.mock('bcrypt');
jest.mock('crypto');
jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/utils/validation');
jest.mock('../../../src/services/emailService');

// Now require the service and dependencies
const authService = require('../../../src/services/authService');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('../../../src/utils/jwt');
const validation = require('../../../src/utils/validation');
const emailService = require('../../../src/services/emailService');
const { User, Student, Faculty } = require('../../../src/models');

describe('Auth Service - Unit Tests (Mocked)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new student successfully', async() => {
            const userData = {
                email: 'teststudent@test.com',
                password: 'Password123',
                role: 'student',
                full_name: 'Test Student',
                student_number: 'STU999',
                department_id: 'dept-id'
            };

            validation.validateEmail.mockReturnValue(true);
            validation.validatePassword.mockReturnValue(true);
            User.findOne.mockResolvedValue(null); // No existing user
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({ toString: () => 'verification-token' });

            const mockUser = {
                id: 'user-id',
                email: userData.email,
                role: userData.role,
                is_verified: false,
                toJSON: () => ({
                    id: 'user-id',
                    email: userData.email,
                    role: userData.role,
                    is_verified: false
                }),
                destroy: jest.fn()
            };
            User.create.mockResolvedValue(mockUser);
            Student.findOne.mockResolvedValue(null); // No existing student
            Student.create.mockResolvedValue({});
            emailService.sendVerificationEmail.mockResolvedValue(true);

            const user = await authService.register(userData);

            expect(validation.validateEmail).toHaveBeenCalledWith(userData.email);
            expect(validation.validatePassword).toHaveBeenCalledWith(userData.password);
            expect(User.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
            expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
            expect(User.create).toHaveBeenCalled();
            expect(Student.create).toHaveBeenCalled();
            expect(user.email).toBe(userData.email);
            expect(user.role).toBe('student');
        });

        it('should register a new faculty successfully', async() => {
            const userData = {
                email: 'testfaculty@test.com',
                password: 'Password123',
                role: 'faculty',
                full_name: 'Test Faculty',
                employee_number: 'EMP999',
                title: 'Professor',
                department_id: 'dept-id'
            };

            validation.validateEmail.mockReturnValue(true);
            validation.validatePassword.mockReturnValue(true);
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({ toString: () => 'verification-token' });

            const mockUser = {
                id: 'user-id',
                email: userData.email,
                role: userData.role,
                toJSON: () => ({
                    id: 'user-id',
                    email: userData.email,
                    role: userData.role
                }),
                destroy: jest.fn()
            };
            User.create.mockResolvedValue(mockUser);
            Faculty.findOne.mockResolvedValue(null);
            Faculty.create.mockResolvedValue({});
            emailService.sendVerificationEmail.mockResolvedValue(true);

            const user = await authService.register(userData);

            expect(Faculty.create).toHaveBeenCalled();
            expect(user.role).toBe('faculty');
        });

        it('should reject duplicate email', async() => {
            const userData = {
                email: 'duplicate@test.com',
                password: 'Password123',
                role: 'student',
                student_number: 'STU001',
                department_id: 'dept-id'
            };

            validation.validateEmail.mockReturnValue(true);
            validation.validatePassword.mockReturnValue(true);
            User.findOne.mockResolvedValue({ id: 'existing-user' }); // Existing user

            await expect(authService.register(userData)).rejects.toThrow('User with this email already exists');
        });

        it('should reject weak password', async() => {
            const userData = {
                email: 'weakpass@test.com',
                password: 'weak',
                role: 'student',
                student_number: 'STU002',
                department_id: 'dept-id'
            };

            validation.validateEmail.mockReturnValue(true);
            validation.validatePassword.mockReturnValue(false);

            await expect(authService.register(userData)).rejects.toThrow('Password must be at least 8 characters');
        });

        it('should reject invalid email', async() => {
            const userData = {
                email: 'invalid-email',
                password: 'Password123',
                role: 'student',
                student_number: 'STU003',
                department_id: 'dept-id'
            };

            validation.validateEmail.mockReturnValue(false);

            await expect(authService.register(userData)).rejects.toThrow('Invalid email format');
        });

        it('should reject student without student number', async() => {
            const userData = {
                email: 'nostudentnum@test.com',
                password: 'Password123',
                role: 'student',
                department_id: 'dept-id'
            };

            validation.validateEmail.mockReturnValue(true);
            validation.validatePassword.mockReturnValue(true);
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({ toString: () => 'token' });

            const mockUser = {
                id: 'user-id',
                destroy: jest.fn()
            };
            User.create.mockResolvedValue(mockUser);

            await expect(authService.register(userData)).rejects.toThrow('Student number and department are required');
        });

        it('should reject duplicate student number', async() => {
            const userData = {
                email: 'student1@test.com',
                password: 'Password123',
                role: 'student',
                student_number: 'STU001',
                department_id: 'dept-id'
            };

            validation.validateEmail.mockReturnValue(true);
            validation.validatePassword.mockReturnValue(true);
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({ toString: () => 'token' });

            const mockUser = {
                id: 'user-id',
                destroy: jest.fn()
            };
            User.create.mockResolvedValue(mockUser);
            Student.findOne.mockResolvedValue({ id: 'existing-student' }); // Existing student

            await expect(authService.register(userData)).rejects.toThrow('Student number already exists');
            expect(mockUser.destroy).toHaveBeenCalled();
        });

        it('should handle admin role registration', async() => {
            const userData = {
                email: 'admin@test.com',
                password: 'Password123',
                role: 'admin',
                full_name: 'Admin User'
            };

            validation.validateEmail.mockReturnValue(true);
            validation.validatePassword.mockReturnValue(true);
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({ toString: () => 'token' });

            const mockUser = {
                id: 'user-id',
                email: userData.email,
                role: userData.role,
                toJSON: () => ({
                    id: 'user-id',
                    email: userData.email,
                    role: userData.role
                })
            };
            User.create.mockResolvedValue(mockUser);
            emailService.sendVerificationEmail.mockResolvedValue(true);

            const user = await authService.register(userData);

            expect(user.role).toBe('admin');
            expect(Student.create).not.toHaveBeenCalled();
            expect(Faculty.create).not.toHaveBeenCalled();
        });
    });

    describe('verifyEmail', () => {
        it('should verify email with valid token', async() => {
            const mockUser = {
                is_verified: false,
                verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                save: jest.fn().mockResolvedValue(true)
            };
            User.findOne.mockResolvedValue(mockUser);

            const result = await authService.verifyEmail('valid-token');

            expect(User.findOne).toHaveBeenCalledWith({
                where: {
                    verification_token: 'valid-token',
                    is_verified: false
                }
            });
            expect(mockUser.is_verified).toBe(true);
            expect(mockUser.verification_token).toBeNull();
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should reject invalid token', async() => {
            User.findOne.mockResolvedValue(null);

            await expect(authService.verifyEmail('invalid-token')).rejects.toThrow('Invalid or expired verification token');
        });

        it('should reject expired token', async() => {
            const mockUser = {
                is_verified: false,
                verification_token_expires: new Date(Date.now() - 1000) // Expired
            };
            User.findOne.mockResolvedValue(mockUser);

            await expect(authService.verifyEmail('expired-token')).rejects.toThrow('Verification token has expired');
        });
    });

    describe('login', () => {
        it('should login with valid credentials', async() => {
            const mockUser = {
                id: 'user-id',
                email: 'login@test.com',
                role: 'student',
                is_verified: true,
                comparePassword: jest.fn().mockResolvedValue(true),
                refresh_token: null,
                save: jest.fn().mockResolvedValue(true),
                toJSON: () => ({
                    id: 'user-id',
                    email: 'login@test.com',
                    role: 'student'
                })
            };
            User.findOne.mockResolvedValue(mockUser);
            jwt.generateAccessToken.mockReturnValue('access-token');
            jwt.generateRefreshToken.mockReturnValue('refresh-token');

            const result = await authService.login('login@test.com', 'Password123');

            expect(User.findOne).toHaveBeenCalled();
            expect(mockUser.comparePassword).toHaveBeenCalledWith('Password123');
            expect(jwt.generateAccessToken).toHaveBeenCalled();
            expect(jwt.generateRefreshToken).toHaveBeenCalled();
            expect(result.accessToken).toBe('access-token');
            expect(result.refreshToken).toBe('refresh-token');
        });

        it('should reject invalid email', async() => {
            User.findOne.mockResolvedValue(null);

            await expect(authService.login('nonexistent@test.com', 'Password123')).rejects.toThrow('Invalid email or password');
        });

        it('should reject unverified email', async() => {
            const mockUser = {
                is_verified: false
            };
            User.findOne.mockResolvedValue(mockUser);

            await expect(authService.login('unverified@test.com', 'Password123')).rejects.toThrow('Please verify your email');
        });

        it('should reject invalid password', async() => {
            const mockUser = {
                is_verified: true,
                comparePassword: jest.fn().mockResolvedValue(false)
            };
            User.findOne.mockResolvedValue(mockUser);

            await expect(authService.login('login@test.com', 'WrongPassword')).rejects.toThrow('Invalid email or password');
        });

        it('should reject login with missing email', async() => {
            await expect(authService.login('', 'Password123')).rejects.toThrow('Email and password are required');
        });

        it('should reject login with missing password', async() => {
            await expect(authService.login('login@test.com', '')).rejects.toThrow('Email and password are required');
        });
    });

    describe('refreshToken', () => {
        it('should refresh access token with valid refresh token', async() => {
            const mockUser = {
                id: 'user-id',
                email: 'refresh@test.com',
                role: 'student',
                refresh_token: 'valid-refresh-token'
            };
            jwt.verifyRefreshToken.mockReturnValue({ id: 'user-id', email: 'refresh@test.com', role: 'student' });
            User.findOne.mockResolvedValue(mockUser);
            jwt.generateAccessToken.mockReturnValue('new-access-token');

            const result = await authService.refreshToken('valid-refresh-token');

            expect(jwt.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
            expect(User.findOne).toHaveBeenCalledWith({ where: { id: 'user-id' } });
            expect(jwt.generateAccessToken).toHaveBeenCalled();
            expect(result.accessToken).toBe('new-access-token');
        });

        it('should reject invalid refresh token', async() => {
            jwt.verifyRefreshToken.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await expect(authService.refreshToken('invalid-token')).rejects.toThrow();
        });

        it('should reject refresh token for non-existent user', async() => {
            jwt.verifyRefreshToken.mockReturnValue({ id: 'non-existent-id' });
            User.findOne.mockResolvedValue(null);

            await expect(authService.refreshToken('token')).rejects.toThrow('Invalid refresh token');
        });

        it('should reject refresh token that does not match stored token', async() => {
            const mockUser = {
                id: 'user-id',
                refresh_token: 'stored-token'
            };
            jwt.verifyRefreshToken.mockReturnValue({ id: 'user-id' });
            User.findOne.mockResolvedValue(mockUser);

            await expect(authService.refreshToken('different-token')).rejects.toThrow('Invalid refresh token');
        });
    });

    describe('logout', () => {
        it('should clear refresh token on logout', async() => {
            const mockUser = {
                refresh_token: 'some-token',
                save: jest.fn().mockResolvedValue(true)
            };
            User.findByPk.mockResolvedValue(mockUser);

            await authService.logout('user-id');

            expect(User.findByPk).toHaveBeenCalledWith('user-id');
            expect(mockUser.refresh_token).toBeNull();
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should handle logout for non-existent user gracefully', async() => {
            User.findByPk.mockResolvedValue(null);

            await expect(authService.logout('non-existent-id')).resolves.not.toThrow();
        });
    });

    describe('forgotPassword', () => {
        it('should send password reset email', async() => {
            const mockUser = {
                reset_password_token: null,
                save: jest.fn().mockResolvedValue(true)
            };
            User.findOne.mockResolvedValue(mockUser);
            crypto.randomBytes.mockReturnValue({ toString: () => 'reset-token' });
            emailService.sendPasswordResetEmail.mockResolvedValue(true);

            const result = await authService.forgotPassword('forgot@test.com');

            expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'forgot@test.com' } });
            expect(mockUser.reset_password_token).toBeDefined();
            expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should return true even if user does not exist (security)', async() => {
            User.findOne.mockResolvedValue(null);

            const result = await authService.forgotPassword('nonexistent@test.com');

            expect(result).toBe(true);
            expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        });

        it('should throw error if email sending fails', async() => {
            const mockUser = {
                save: jest.fn().mockResolvedValue(true)
            };
            User.findOne.mockResolvedValue(mockUser);
            crypto.randomBytes.mockReturnValue({ toString: () => 'reset-token' });
            emailService.sendPasswordResetEmail.mockRejectedValue(new Error('SMTP Error'));

            await expect(authService.forgotPassword('fail@test.com')).rejects.toThrow('Failed to send password reset email');
        });
    });

    describe('resetPassword', () => {
        it('should reset password with valid token', async() => {
            const mockUser = {
                password_hash: 'oldhash',
                reset_password_token: 'valid-token',
                reset_password_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                refresh_token: 'active-session',
                save: jest.fn().mockResolvedValue(true)
            };
            validation.validatePassword.mockReturnValue(true);
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.hash.mockResolvedValue('new-hashed-password');

            await authService.resetPassword('valid-token', 'NewPassword123');

            expect(validation.validatePassword).toHaveBeenCalledWith('NewPassword123');
            expect(User.findOne).toHaveBeenCalledWith({
                where: { reset_password_token: 'valid-token' }
            });
            expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', 10);
            expect(mockUser.password_hash).toBe('new-hashed-password');
            expect(mockUser.reset_password_token).toBeNull();
            expect(mockUser.refresh_token).toBeNull();
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should reject invalid token', async() => {
            validation.validatePassword.mockReturnValue(true);
            User.findOne.mockResolvedValue(null);

            await expect(authService.resetPassword('invalid-token', 'NewPassword123')).rejects.toThrow('Invalid or expired reset token');
        });

        it('should reject weak password', async() => {
            validation.validatePassword.mockReturnValue(false);

            await expect(authService.resetPassword('valid-token', 'weak')).rejects.toThrow('Password must be at least 8 characters');
        });

        it('should reject expired token', async() => {
            const mockUser = {
                reset_password_token: 'expired-token',
                reset_password_expires: new Date(Date.now() - 1000) // Expired
            };
            validation.validatePassword.mockReturnValue(true);
            User.findOne.mockResolvedValue(mockUser);

            await expect(authService.resetPassword('expired-token', 'NewPassword123')).rejects.toThrow('Reset token has expired');
        });
    });
});