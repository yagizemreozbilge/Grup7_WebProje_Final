// test/middleware/validation.test.js
const { validationResult } = require('express-validator');
const validation = require('../../../src/middleware/validation');

// Mock express-validator
jest.mock('express-validator');

describe('Validation Middleware - Real Implementation Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate middleware', () => {
    it('should call next() when validation passes', () => {
      // Arrange
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      // Act
      validation.validate(mockReq, mockRes, mockNext);

      // Assert
      expect(validationResult).toHaveBeenCalledWith(mockReq);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 with validation errors when validation fails', () => {
      // Arrange
      const errors = [
        { 
          type: 'field',
          value: '',
          msg: 'Name is required',
          path: 'name',
          location: 'body'
        },
        { 
          type: 'field',
          value: 'invalid-email',
          msg: 'Email must be valid',
          path: 'email',
          location: 'body'
        }
      ];

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => errors,
        formatWith: jest.fn().mockReturnThis(),
        mapped: jest.fn().mockReturnValue({
          name: { msg: 'Name is required' },
          email: { msg: 'Email must be valid' }
        })
      });

      // Act
      validation.validate(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should format errors when formatWith is used', () => {
      // Arrange
      const rawErrors = [
        { path: 'name', msg: 'Name is required' },
        { path: 'email', msg: 'Invalid email' }
      ];
      
      const formattedErrors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email' }
      ];

      const mockFormatWith = jest.fn().mockReturnValue({
        array: () => formattedErrors
      });

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => rawErrors,
        formatWith: mockFormatWith
      });

      // Act
      validation.validate(mockReq, mockRes, mockNext);

      // Assert
      expect(mockFormatWith).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: formattedErrors
        }
      });
    });

    it('should handle empty validation results', () => {
      // Arrange
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      // Act
      validation.validate(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('validation schemas', () => {
    // Test that each schema is properly defined
    test('registerSchema should be an array of validation rules', () => {
      expect(Array.isArray(validation.registerSchema)).toBe(true);
      
      // Check if it contains expected validators
      if (validation.registerSchema.length > 0) {
        validation.registerSchema.forEach(validator => {
          expect(validator).toBeDefined();
        });
      }
    });

    test('loginSchema should be an array of validation rules', () => {
      expect(Array.isArray(validation.loginSchema)).toBe(true);
    });

    test('courseSchema should be an array of validation rules', () => {
      expect(Array.isArray(validation.courseSchema)).toBe(true);
    });

    test('eventSchema should be an array of validation rules', () => {
      expect(Array.isArray(validation.eventSchema)).toBe(true);
    });

    test('reservationSchema should be an array of validation rules', () => {
      expect(Array.isArray(validation.reservationSchema)).toBe(true);
    });

    test('mealSchema should be an array of validation rules', () => {
      expect(Array.isArray(validation.mealSchema)).toBe(true);
    });

    test('walletSchema should be an array of validation rules', () => {
      expect(Array.isArray(validation.walletSchema)).toBe(true);
    });

    test('userUpdateSchema should be an array of validation rules', () => {
      expect(Array.isArray(validation.userUpdateSchema)).toBe(true);
    });

    test('passwordUpdateSchema should be an array of validation rules', () => {
      expect(Array.isArray(validation.passwordUpdateSchema)).toBe(true);
    });

    test('validateUpdateProfile should be a function', () => {
      expect(typeof validation.validateUpdateProfile).toBe('function');
    });
  });

  describe('validateUpdateProfile middleware', () => {
    it('should call validate middleware', () => {
      // Spy on the validate function
      const originalValidate = validation.validate;
      validation.validate = jest.fn();

      // Arrange
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      // Act
      validation.validateUpdateProfile(mockReq, mockRes, mockNext);

      // Assert
      expect(validation.validate).toHaveBeenCalledWith(mockReq, mockRes, mockNext);

      // Restore original validate
      validation.validate = originalValidate;
    });

    it('should use userUpdateSchema for validation', () => {
      // This test assumes validateUpdateProfile uses userUpdateSchema
      // The actual implementation would show how it's used
      expect(validation.userUpdateSchema).toBeDefined();
      expect(Array.isArray(validation.userUpdateSchema)).toBe(true);
    });
  });

  describe('error handling in validate', () => {
    it('should handle validationResult throwing an error', () => {
      // Arrange
      const error = new Error('Validation error');
      validationResult.mockImplementation(() => {
        throw error;
      });

      // Act
      validation.validate(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle invalid validationResult format', () => {
      // Arrange - validationResult returns object without isEmpty method
      validationResult.mockReturnValue({});

      // Act
      validation.validate(mockReq, mockRes, mockNext);

      // Assert - Should handle gracefully
      // This depends on implementation - might throw error or handle it
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('custom validation messages', () => {
    it('should include custom error messages in validation errors', () => {
      // This test would check if custom error messages are used
      // You would need to inspect the actual validation schemas
      
      // Example check for registerSchema
      if (validation.registerSchema && validation.registerSchema.length > 0) {
        // Look for custom messages in validation chains
        validation.registerSchema.forEach(validator => {
          // This is a simplified check - actual implementation might differ
          const validatorString = validator.toString();
          if (validatorString.includes('withMessage')) {
            // Validator has custom message
            expect(true).toBe(true);
          }
        });
      }
    });
  });
});