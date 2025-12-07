const { validateRegister, validateLogin, validateUpdateProfile, validateResetPassword } = require('../../../src/middleware/validation');

describe('Validation Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('validateRegister', () => {
        it('should pass validation for valid student registration', () => {
            req.body = {
                email: 'student@test.com',
                password: 'Password123',
                role: 'student',
                student_number: 'STU001',
                department_id: 'dept-id'
            };

            validateRegister(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should pass validation for valid faculty registration', () => {
            req.body = {
                email: 'faculty@test.com',
                password: 'Password123',
                role: 'faculty',
                employee_number: 'EMP001',
                title: 'Professor',
                department_id: 'dept-id'
            };

            validateRegister(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject invalid email', () => {
            req.body = {
                email: 'invalid-email',
                password: 'Password123',
                role: 'student'
            };

            validateRegister(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Valid email is required' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject weak password', () => {
            req.body = {
                email: 'test@test.com',
                password: 'weak',
                role: 'student'
            };

            validateRegister(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject student without student_number', () => {
            req.body = {
                email: 'test@test.com',
                password: 'Password123',
                role: 'student',
                department_id: 'dept-id'
            };

            validateRegister(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Student number is required for students' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject faculty without employee_number', () => {
            req.body = {
                email: 'test@test.com',
                password: 'Password123',
                role: 'faculty',
                title: 'Professor',
                department_id: 'dept-id'
            };

            validateRegister(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Employee number is required for faculty' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateLogin', () => {
        it('should pass validation for valid login', () => {
            req.body = {
                email: 'test@test.com',
                password: 'Password123'
            };

            validateLogin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject invalid email', () => {
            req.body = {
                email: 'invalid-email',
                password: 'Password123'
            };

            validateLogin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Valid email is required' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject missing password', () => {
            req.body = {
                email: 'test@test.com'
            };

            validateLogin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Password is required' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateUpdateProfile', () => {
        it('should pass validation for valid phone', () => {
            req.body = {
                phone: '+905551234567'
            };

            validateUpdateProfile(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject invalid phone format', () => {
            req.body = {
                phone: 'invalid'
            };

            validateUpdateProfile(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid phone number format' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should pass if phone is not provided', () => {
            req.body = {
                full_name: 'Test User'
            };

            validateUpdateProfile(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('validateResetPassword', () => {
        it('should pass validation for valid password', () => {
            req.body = {
                password: 'NewPassword123'
            };

            validateResetPassword(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject weak password', () => {
            req.body = {
                password: 'weak'
            };

            validateResetPassword(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject missing password', () => {
            req.body = {};

            validateResetPassword(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });
    });
});