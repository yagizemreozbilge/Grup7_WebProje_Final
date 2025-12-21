// test/middleware/errorHandler.test.js
const errorHandler = require('../../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should handle generic errors with 500 status', () => {
    // Arrange
    const error = new Error('Something went wrong');

    // Act
    errorHandler(error, mockReq, mockRes, mockNext);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' }
    });
  });

  it('should handle validation errors with 400 status', () => {
    // Arrange
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.details = [{ message: 'Field is required' }];

    // Act
    errorHandler(error, mockReq, mockRes, mockNext);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.details }
    });
  });

  it('should handle unauthorized errors with 401 status', () => {
    // Arrange
    const error = new Error('Unauthorized access');
    error.statusCode = 401;

    // Act
    errorHandler(error, mockReq, mockRes, mockNext);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized access' }
    });
  });

  it('should handle forbidden errors with 403 status', () => {
    // Arrange
    const error = new Error('Access forbidden');
    error.statusCode = 403;

    // Act
    errorHandler(error, mockReq, mockRes, mockNext);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access forbidden' }
    });
  });

  it('should handle not found errors with 404 status', () => {
    // Arrange
    const error = new Error('Resource not found');
    error.statusCode = 404;

    // Act
    errorHandler(error, mockReq, mockRes, mockNext);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' }
    });
  });

  it('should handle conflict errors with 409 status', () => {
    // Arrange
    const error = new Error('Resource already exists');
    error.statusCode = 409;

    // Act
    errorHandler(error, mockReq, mockRes, mockNext);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'CONFLICT', message: 'Resource already exists' }
    });
  });

  it('should handle custom error codes', () => {
    // Arrange
    const error = new Error('Custom error');
    error.code = 'CUSTOM_ERROR';
    error.statusCode = 422;

    // Act
    errorHandler(error, mockReq, mockRes, mockNext);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'CUSTOM_ERROR', message: 'Custom error' }
    });
  });

  it('should use default message when error message is empty', () => {
    // Arrange
    const error = new Error('');
    error.statusCode = 400;

    // Act
    errorHandler(error, mockReq, mockRes, mockNext);

    // Assert
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Bad Request' }
    });
  });

  it('should handle errors without statusCode (default to 500)', () => {
    // Arrange
    const error = new Error('Unknown error');

    // Act
    errorHandler(error, mockReq, mockRes, mockNext);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should include stack trace in development environment', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Dev error');
    error.stack = 'Error stack trace';

    // Act
    errorHandler(error, mockReq, mockRes, mockNext);

    // Assert
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: { 
        code: 'INTERNAL_SERVER_ERROR', 
        message: 'Dev error',
        stack: 'Error stack trace'
      }
    });

    // Cleanup
    process.env.NODE_ENV = originalEnv;
  });

  it('should exclude stack trace in production environment', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new Error('Prod error');
    error.stack = 'Error stack trace';

    // Act
    errorHandler(error, mockReq, mockRes, mockNext);

    // Assert
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: { 
        code: 'INTERNAL_SERVER_ERROR', 
        message: 'Prod error'
        // No stack property
      }
    });

    // Cleanup
    process.env.NODE_ENV = originalEnv;
  });
});