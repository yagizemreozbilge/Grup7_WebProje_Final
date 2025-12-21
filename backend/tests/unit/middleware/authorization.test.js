// test/middleware/authorization.test.js
const { authorize } = require('../../../src/middleware/authorization');

describe('Authorization Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      user: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('authorize middleware', () => {
    it('should call next() when user has required role', () => {
      // Arrange
      mockReq.user.role = 'admin';
      const middleware = authorize(['admin', 'faculty']);

      // Act
      middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have required role', () => {
      // Arrange
      mockReq.user.role = 'student';
      const middleware = authorize(['admin', 'faculty']);

      // Act
      middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is undefined', () => {
      // Arrange
      mockReq.user = {}; // no role
      const middleware = authorize(['admin']);

      // Act
      middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    });

    it('should work with single role requirement', () => {
      // Arrange
      mockReq.user.role = 'faculty';
      const middleware = authorize(['faculty']);

      // Act
      middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty roles array', () => {
      // Arrange
      mockReq.user.role = 'student';
      const middleware = authorize([]);

      // Act
      middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled(); // Empty array means no restrictions
    });

    it('should be case sensitive for roles', () => {
      // Arrange
      mockReq.user.role = 'Admin'; // uppercase A
      const middleware = authorize(['admin']); // lowercase a

      // Act
      middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403); // Should fail due to case mismatch
    });

    it('should handle multiple user roles (if implemented as array)', () => {
      // This test assumes user.role is a string, but can be adapted if roles are arrays
      // Arrange
      mockReq.user.role = 'admin';
      const middleware = authorize(['admin', 'super_admin']);

      // Act
      middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });
});