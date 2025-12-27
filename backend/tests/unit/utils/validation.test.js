// test/utils/validation.test.js
const { validateEmail, validatePassword, validatePhone } = require('../../../src/utils/validation');

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should return true for valid .edu email', () => {
      // Arrange
      const validEmails = [
        'student@university.edu',
        'faculty@college.edu',
        'admin@school.edu',
        'test@test.edu'
      ];

      // Act & Assert
      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should return false for email without .edu', () => {
      // Arrange
      const invalidEmails = [
        'student@gmail.com',
        'faculty@yahoo.com',
        'admin@hotmail.com',
        'test@example.com'
      ];

      // Act & Assert
      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should return false for invalid email format', () => {
      // Arrange
      const invalidEmails = [
        'notanemail',
        '@university.edu',
        'student@.edu',
        'student@university',
        '',
        null,
        undefined
      ];

      // Act & Assert
      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should be case insensitive', () => {
      // Arrange
      const emails = [
        'STUDENT@UNIVERSITY.EDU',
        'student@UNIVERSITY.edu',
        'Student@University.Edu'
      ];

      // Act & Assert
      emails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should accept .edu.tr emails', () => {
      // Arrange
      const email = 'student@university.edu.tr';

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', () => {
      // Arrange
      const validPasswords = [
        'Password123',
        'MyPass123',
        'Secure123',
        'Test@123',
        'Pass123!',
        'P@ssw0rd'
      ];

      // Act & Assert
      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true);
      });
    });

    it('should return false for password without uppercase', () => {
      // Arrange
      const invalidPasswords = [
        'password123',
        'lowercase123',
        'test123'
      ];

      // Act & Assert
      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it('should return false for password without lowercase', () => {
      // Arrange
      const invalidPasswords = [
        'PASSWORD123',
        'UPPERCASE123',
        'TEST123'
      ];

      // Act & Assert
      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it('should return false for password without number', () => {
      // Arrange
      const invalidPasswords = [
        'Password',
        'MyPassword',
        'SecurePass'
      ];

      // Act & Assert
      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it('should return false for password shorter than 8 characters', () => {
      // Arrange
      const invalidPasswords = [
        'Pass1',
        'Test12',
        'Ab1',
        'P1'
      ];

      // Act & Assert
      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it('should accept passwords with special characters', () => {
      // Arrange
      const validPasswords = [
        'Password@123',
        'MyPass!123',
        'Secure#123',
        'Test$123',
        'Pass%123',
        'P@ssw0rd'
      ];

      // Act & Assert
      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true);
      });
    });

    it('should return false for empty or null password', () => {
      // Arrange
      const invalidPasswords = [
        '',
        null,
        undefined
      ];

      // Act & Assert
      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });
  });

  describe('validatePhone', () => {
    it('should return true for valid phone numbers', () => {
      // Arrange
      const validPhones = [
        '5551234567',
        '555-123-4567',
        '(555) 123-4567',
        '555 123 4567',
        '+90 555 123 45 67',
        '55512345678'
      ];

      // Act & Assert
      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    it('should return false for phone numbers with less than 10 digits', () => {
      // Arrange
      const invalidPhones = [
        '123',
        '555123',
        '555-123',
        '123456789'
      ];

      // Act & Assert
      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false);
      });
    });

    it('should return false for phone numbers with letters', () => {
      // Arrange
      const invalidPhones = [
        '555-123-ABCD',
        'phone123',
        '555-ABC-1234',
        'abc1234567'
      ];

      // Act & Assert
      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false);
      });
    });

    it('should return false for phone numbers with invalid characters', () => {
      // Arrange
      const invalidPhones = [
        '555@123-4567',
        '555#1234567',
        '555$1234567',
        '555.123.4567'
      ];

      // Act & Assert
      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false);
      });
    });

    it('should accept phone numbers with spaces, dashes, and parentheses', () => {
      // Arrange
      const validPhones = [
        '555 123 4567',
        '555-123-4567',
        '(555) 123-4567',
        '(555)123-4567',
        '555 (123) 4567'
      ];

      // Act & Assert
      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    it('should return false for empty or null phone', () => {
      // Arrange
      const invalidPhones = [
        '',
        null,
        undefined
      ];

      // Act & Assert
      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false);
      });
    });

    it('should count only digits for length validation', () => {
      // Arrange
      const validPhone = '(555) 123-4567'; // 10 digits
      const invalidPhone = '(555) 123-456'; // 9 digits

      // Act & Assert
      expect(validatePhone(validPhone)).toBe(true);
      expect(validatePhone(invalidPhone)).toBe(false);
    });
  });
});

