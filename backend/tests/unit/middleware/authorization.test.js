const { authorize } = require('../../../src/middleware/authorization');

describe('Authorization Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should allow access for authorized role', () => {
        req.user = { id: 'user-id', role: 'admin' };
        const middleware = authorize('admin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access for multiple authorized roles', () => {
        req.user = { id: 'user-id', role: 'student' };
        const middleware = authorize('student', 'faculty', 'admin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
        req.user = { id: 'user-id', role: 'student' };
        const middleware = authorize('admin');

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not authenticated', () => {
        req.user = null;
        const middleware = authorize('admin');

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should work with multiple roles', () => {
        req.user = { id: 'user-id', role: 'faculty' };
        const middleware = authorize('faculty', 'admin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
