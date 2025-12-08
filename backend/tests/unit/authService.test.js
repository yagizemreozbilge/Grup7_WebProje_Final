const bcrypt = require('bcrypt');
const authService = require('../../src/services/authService');
const jwtUtils = require('../../src/utils/jwt');

jest.mock('../../src/models', () => {
    const makeUser = () => ({
        id: 'user-1',
        email: 'student@test.edu',
        role: 'student',
        is_verified: true,
        refresh_token: null,
        comparePassword: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
            id: 'user-1',
            email: 'student@test.edu',
            role: 'student',
            password_hash: 'hashed',
            refresh_token: 'rt',
            verification_token: 'vt',
            reset_password_token: 'rp'
        })
    });

    return {
        __esModule: true,
        User: {
            findOne: jest.fn(),
            findByPk: jest.fn(),
            create: jest.fn(),
            _factory: makeUser
        },
        Student: { create: jest.fn(), findOne: jest.fn() },
        Faculty: { create: jest.fn(), findOne: jest.fn() },
        Department: {}
    };
});

jest.mock('../../src/services/emailService', () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}));

const { User, Student, Faculty } = require('../../src/models');
const jwtModule = require('../../src/utils/jwt');

const makeUser = () => User._factory();

describe('authService (unit)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('registers student with hashing and creates student profile', async() => {
        User.findOne.mockResolvedValue(null);
        const mockUser = makeUser();
        User.create.mockResolvedValue(mockUser);
        Student.create.mockResolvedValue({});

        const result = await authService.register({
            email: 'new@test.edu',
            password: 'Password123',
            role: 'student',
            full_name: 'New User',
            student_number: 'STU100',
            department_id: 'dep-1'
        });

        expect(User.create).toHaveBeenCalled();
        expect(Student.create).toHaveBeenCalledWith({
            user_id: mockUser.id,
            student_number: 'STU100',
            department_id: 'dep-1'
        });
        expect(result.email).toBe('new@test.edu');
        expect(result).not.toHaveProperty('password_hash');
    });

    it('registers faculty and handles duplicate employee number', async() => {
        User.findOne.mockResolvedValue(null);
        Faculty.findOne.mockResolvedValue({ id: 'f1' });

        await expect(
            authService.register({
                email: 'fac@test.edu',
                password: 'Password123',
                role: 'faculty',
                full_name: 'Prof',
                employee_number: 'EMP1',
                title: 'Professor',
                department_id: 'dep-1'
            })
        ).rejects.toThrow('Employee number already exists');
    });

    it('rejects duplicate email', async() => {
        User.findOne.mockResolvedValue({ id: 'existing' });

        await expect(
            authService.register({
                email: 'dup@test.edu',
                password: 'Password123',
                role: 'student',
                student_number: 'STU002',
                department_id: 'dep-1'
            })
        ).rejects.toThrow('User with this email already exists');
    });

    it('logs in when credentials match and saves refresh token', async() => {
        const mockUser = makeUser();
        mockUser.comparePassword.mockResolvedValue(true);
        mockUser.toJSON.mockReturnValue({
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role
        });
        User.findOne.mockResolvedValue(mockUser);

        const result = await authService.login('student@test.edu', 'Password123');

        expect(mockUser.comparePassword).toHaveBeenCalledWith('Password123');
        expect(mockUser.save).toHaveBeenCalled();
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
    });

    it('rejects login for unverified users', async() => {
        const mockUser = makeUser();
        mockUser.is_verified = false;
        User.findOne.mockResolvedValue(mockUser);

        await expect(authService.login('student@test.edu', 'Password123')).rejects.toThrow(
            'Please verify your email before logging in'
        );
    });

    it('rejects login for wrong password', async() => {
        const mockUser = makeUser();
        mockUser.comparePassword.mockResolvedValue(false);
        User.findOne.mockResolvedValue(mockUser);

        await expect(authService.login('student@test.edu', 'WrongPass')).rejects.toThrow(
            'Invalid email or password'
        );
    });

    it('generates and verifies JWT tokens', () => {
        const payload = { id: 'u1', email: 'x@test.edu', role: 'student' };
        const access = jwtUtils.generateAccessToken(payload);
        const decoded = jwtUtils.verifyAccessToken(access);
        expect(decoded.id).toBe(payload.id);
        expect(typeof access).toBe('string');
    });

    it('hashes and compares password with bcrypt', async() => {
        const password = 'Password123';
        const hash = await bcrypt.hash(password, 10);
        expect(hash).not.toBe(password);
        expect(await bcrypt.compare(password, hash)).toBe(true);
        expect(await bcrypt.compare('Wrong', hash)).toBe(false);
    });

    it('rejects login when user not found', async() => {
        User.findOne.mockResolvedValue(null);
        await expect(authService.login('missing@test.edu', 'Password123')).rejects.toThrow(
            'Invalid email or password'
        );
    });

    it('rejects registration with invalid email', async() => {
        await expect(
            authService.register({
                email: 'bad',
                password: 'Password123',
                role: 'student',
                student_number: 'STU1',
                department_id: 'dep'
            })
        ).rejects.toThrow('Invalid email format');
    });

    it('rejects registration with weak password', async() => {
        await expect(
            authService.register({
                email: 'ok@test.edu',
                password: 'weak',
                role: 'student',
                student_number: 'STU1',
                department_id: 'dep'
            })
        ).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('rejects student registration missing required fields', async() => {
        await expect(
            authService.register({
                email: 'ok@test.edu',
                password: 'Password123',
                role: 'student'
            })
        ).rejects.toThrow('Student number and department are required for students');
    });

    it('rejects faculty registration missing title', async() => {
        User.findOne.mockResolvedValue(null);
        await expect(
            authService.register({
                email: 'fac2@test.edu',
                password: 'Password123',
                role: 'faculty',
                employee_number: 'EMP9',
                department_id: 'dep-1'
            })
        ).rejects.toThrow('Employee number, department, and title are required for faculty');
    });

    it('rejects duplicate student number', async() => {
        User.findOne.mockResolvedValue(null);
        const mockUser = makeUser();
        mockUser.destroy = jest.fn();
        User.create.mockResolvedValue(mockUser);
        Student.findOne.mockResolvedValue({ id: 's1' });

        await expect(
            authService.register({
                email: 'new2@test.edu',
                password: 'Password123',
                role: 'student',
                full_name: 'New User',
                student_number: 'STU100',
                department_id: 'dep-1'
            })
        ).rejects.toThrow('Student number already exists');
        expect(mockUser.destroy).toHaveBeenCalled();
    });

    it('rejects duplicate employee number', async() => {
        User.findOne.mockResolvedValue(null);
        const mockUser = makeUser();
        mockUser.destroy = jest.fn();
        User.create.mockResolvedValue(mockUser);
        Faculty.findOne.mockResolvedValue({ id: 'f1' });

        await expect(
            authService.register({
                email: 'fac3@test.edu',
                password: 'Password123',
                role: 'faculty',
                full_name: 'Prof',
                employee_number: 'EMP1',
                title: 'Professor',
                department_id: 'dep-1'
            })
        ).rejects.toThrow('Employee number already exists');
        expect(mockUser.destroy).toHaveBeenCalled();
    });

    it('verifies email with valid token', async() => {
        const user = {
            id: 'u1',
            is_verified: false,
            verification_token: 'token',
            verification_token_expires: new Date(Date.now() + 10000),
            save: jest.fn().mockResolvedValue(true)
        };
        User.findOne.mockResolvedValue(user);
        const result = await authService.verifyEmail('token');
        expect(result).toBe(user);
        expect(user.is_verified).toBe(true);
        expect(user.verification_token).toBeNull();
    });

    it('rejects verifyEmail with invalid token', async() => {
        User.findOne.mockResolvedValue(null);
        await expect(authService.verifyEmail('bad')).rejects.toThrow('Invalid or expired verification token');
    });

    it('rejects verifyEmail with expired token', async() => {
        User.findOne.mockResolvedValue({
            verification_token_expires: new Date(Date.now() - 1000)
        });
        await expect(authService.verifyEmail('token')).rejects.toThrow('Verification token has expired');
    });

    it('refreshToken rejects invalid token', async() => {
        await expect(authService.refreshToken('bad')).rejects.toThrow('Invalid or expired refresh token');
    });

    it('logout handles missing user silently', async() => {
        User.findByPk = jest.fn().mockResolvedValue(null);
        await expect(authService.logout('missing')).resolves.toBeUndefined();
    });

    it('forgotPassword returns true when user missing', async() => {
        User.findOne.mockResolvedValue(null);
        await expect(authService.forgotPassword('none@test.edu')).resolves.toBe(true);
    });

    it('resetPassword rejects weak password', async() => {
        await expect(authService.resetPassword('token', 'weak')).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('resetPassword rejects invalid token', async() => {
        User.findOne.mockResolvedValue(null);
        await expect(authService.resetPassword('token', 'Password123')).rejects.toThrow('Invalid or expired reset token');
    });

    it('resetPassword rejects expired token', async() => {
        User.findOne.mockResolvedValue({
            reset_password_expires: new Date(Date.now() - 1000)
        });
        await expect(authService.resetPassword('token', 'Password123')).rejects.toThrow('Reset token has expired');
    });

    it('refreshToken returns new access token when valid', async() => {
        jest.spyOn(jwtModule, 'verifyRefreshToken').mockReturnValue({ id: 'user-1', email: 'student@test.edu', role: 'student' });
        const user = makeUser();
        user.refresh_token = 'valid-refresh';
        User.findOne.mockResolvedValue(user);

        const result = await authService.refreshToken('valid-refresh');
        expect(result.accessToken).toBeDefined();
    });

    it('refreshToken rejects when stored token mismatch', async() => {
        jest.spyOn(jwtModule, 'verifyRefreshToken').mockReturnValue({ id: 'user-1', email: 'student@test.edu', role: 'student' });
        const user = makeUser();
        user.refresh_token = 'other';
        User.findOne.mockResolvedValue(user);

        await expect(authService.refreshToken('valid-refresh')).rejects.toThrow('Invalid refresh token');
    });

    it('forgotPassword sends reset mail for existing user', async() => {
        const user = makeUser();
        user.save = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(user);

        await expect(authService.forgotPassword('student@test.edu')).resolves.toBe(true);
    });

    it('forgotPassword throws when email send fails', async() => {
        const emailService = require('../../src/services/emailService');
        emailService.sendPasswordResetEmail.mockRejectedValue(new Error('smtp error'));
        const user = makeUser();
        user.save = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(user);

        await expect(authService.forgotPassword('student@test.edu')).rejects.toThrow('Failed to send password reset email');
    });

    it('resetPassword updates password and clears tokens', async() => {
        const user = {
            reset_password_expires: new Date(Date.now() + 10000),
            save: jest.fn().mockResolvedValue(true)
        };
        User.findOne.mockResolvedValue(user);

        await expect(authService.resetPassword('token', 'Password123')).resolves.toBe(true);
        expect(user.reset_password_token).toBeNull();
        expect(user.refresh_token).toBeNull();
    });

    it('logout clears refresh token when user exists', async() => {
        const user = { refresh_token: 'abc', save: jest.fn().mockResolvedValue(true) };
        User.findByPk = jest.fn().mockResolvedValue(user);
        await authService.logout('user-1');
        expect(user.refresh_token).toBeNull();
        expect(user.save).toHaveBeenCalled();
    });
});