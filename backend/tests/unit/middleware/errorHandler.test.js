const errorHandler = require('../../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
        process.env.NODE_ENV = 'test';
    });

    it('should handle SequelizeValidationError', () => {
        const error = {
            name: 'SequelizeValidationError',
            errors: [
                { message: 'Email is required' },
                { message: 'Password is required' }
            ]
        };

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Validation error',
            details: ['Email is required', 'Password is required']
        });
    });

    it('should handle SequelizeUniqueConstraintError', () => {
        const error = {
            name: 'SequelizeUniqueConstraintError',
            errors: [
                { message: 'Email must be unique' }
            ]
        };

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Duplicate entry',
            details: ['Email must be unique']
        });
    });

    it('should handle SequelizeForeignKeyConstraintError', () => {
        const error = {
            name: 'SequelizeForeignKeyConstraintError'
        };

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Invalid reference',
            details: 'Referenced record does not exist'
        });
    });

    it('should handle custom application error with statusCode', () => {
        const error = {
            message: 'Custom error',
            statusCode: 404
        };

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Custom error'
        });
    });

    it('should handle custom application error without statusCode', () => {
        const error = {
            message: 'Custom error'
        };

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Custom error'
        });
    });

    it('should handle generic error', () => {
        const error = new Error('Generic error');

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Internal server error',
            message: undefined
        });
    });

    it('should include error message in development mode', () => {
        process.env.NODE_ENV = 'development';
        const error = new Error('Development error');

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Internal server error',
            message: 'Development error'
        });
    });
});