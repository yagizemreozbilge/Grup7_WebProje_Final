const sanitizeInput = require('../../../src/middleware/inputSanitization');
const logger = require('../../../src/utils/logger');

jest.mock('../../../src/utils/logger', () => ({
    warn: jest.fn()
}));

describe('Input Sanitization Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            method: 'POST',
            body: {},
            query: {},
            params: {}
        };
        res = {};
        next = jest.fn();
    });

    it('should skip sanitization for OPTIONS requests', () => {
        req.method = 'OPTIONS';

        sanitizeInput(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.body).toEqual({});
    });

    it('should sanitize script tags in request body', () => {
        req.body = {
            name: '<script>alert("xss")</script>Hello',
            description: 'Normal text'
        };

        sanitizeInput(req, res, next);

        expect(req.body.name).toBe('Hello');
        expect(req.body.description).toBe('Normal text');
        expect(next).toHaveBeenCalled();
    });

    it('should sanitize javascript: protocol', () => {
        req.body = {
            url: 'javascript:alert("xss")'
        };

        sanitizeInput(req, res, next);

        expect(req.body.url).toBe('alert("xss")');
        expect(next).toHaveBeenCalled();
    });

    it('should sanitize event handlers', () => {
        req.body = {
            text: 'onclick=alert("xss")'
        };

        sanitizeInput(req, res, next);

        expect(req.body.text).toBe('alert("xss")');
        expect(next).toHaveBeenCalled();
    });

    it('should sanitize nested objects', () => {
        req.body = {
            user: {
                name: '<script>alert("xss")</script>',
                email: 'test@test.com'
            }
        };

        sanitizeInput(req, res, next);

        expect(req.body.user.name).toBe('');
        expect(req.body.user.email).toBe('test@test.com');
        expect(next).toHaveBeenCalled();
    });

    it('should sanitize arrays', () => {
        req.body = {
            items: ['<script>alert("xss")</script>', 'normal']
        };

        sanitizeInput(req, res, next);

        expect(req.body.items[0]).toBe('');
        expect(req.body.items[1]).toBe('normal');
        expect(next).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
        req.query = {
            search: '<script>alert("xss")</script>',
            page: '1'
        };

        sanitizeInput(req, res, next);

        expect(req.query.search).toBe('');
        expect(req.query.page).toBe('1');
        expect(next).toHaveBeenCalled();
    });

    it('should sanitize params', () => {
        req.params = {
            id: '<script>alert("xss")</script>123'
        };

        sanitizeInput(req, res, next);

        expect(req.params.id).toBe('123');
        expect(next).toHaveBeenCalled();
    });

    it('should handle non-string values', () => {
        req.body = {
            number: 123,
            boolean: true,
            nullValue: null,
            object: { key: 'value' }
        };

        sanitizeInput(req, res, next);

        expect(req.body.number).toBe(123);
        expect(req.body.boolean).toBe(true);
        expect(req.body.nullValue).toBe(null);
        expect(req.body.object.key).toBe('value');
        expect(next).toHaveBeenCalled();
    });

    it('should handle sanitization errors gracefully', () => {
        req.body = {
            get value() {
                throw new Error('Cannot read property');
            }
        };

        sanitizeInput(req, res, next);

        expect(logger.warn).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    it('should handle null body', () => {
        req.body = null;

        sanitizeInput(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should handle array body', () => {
        req.body = ['item1', '<script>alert("xss")</script>'];

        sanitizeInput(req, res, next);

        expect(Array.isArray(req.body)).toBe(true);
        expect(next).toHaveBeenCalled();
    });
});

