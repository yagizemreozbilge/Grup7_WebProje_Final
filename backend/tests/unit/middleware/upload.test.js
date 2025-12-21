// test/middleware/upload.test.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = require('../../../src/middleware/upload');

// Mock multer
jest.mock('multer');

describe('Upload Middleware - Real Implementation Tests', () => {
  let mockMulterInstance;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Create mock multer instance
    mockMulterInstance = {
      diskStorage: jest.fn(),
      single: jest.fn(() => (req, res, next) => next()),
      array: jest.fn(() => (req, res, next) => next()),
      fields: jest.fn(() => (req, res, next) => next())
    };
    
    multer.mockReturnValue(mockMulterInstance);

    mockReq = {
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('single middleware', () => {
    it('should create multer instance with correct configuration', () => {
      // Act
      const middleware = upload.single('file');

      // Assert
      expect(multer).toHaveBeenCalledTimes(1);
      
      // Check multer was called with configuration
      const multerConfig = multer.mock.calls[0][0];
      expect(multerConfig).toHaveProperty('storage');
      expect(multerConfig).toHaveProperty('fileFilter');
      expect(multerConfig).toHaveProperty('limits');
      
      // Check limits
      expect(multerConfig.limits).toEqual({
        fileSize: 5 * 1024 * 1024 // 5MB
      });
      
      // Check middleware is a function
      expect(typeof middleware).toBe('function');
      expect(mockMulterInstance.single).toHaveBeenCalledWith('file');
    });

    it('should call next on successful upload', async () => {
      // Arrange
      const middleware = upload.single('file');
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg'
      };
      mockReq.file = mockFile;

      // Act
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('array middleware', () => {
    it('should configure multer for array uploads', () => {
      // Act
      const middleware = upload.array('photos', 3);

      // Assert
      expect(mockMulterInstance.array).toHaveBeenCalledWith('photos', 3);
      expect(typeof middleware).toBe('function');
    });
  });

  describe('fields middleware', () => {
    it('should configure multer for multiple field uploads', () => {
      // Arrange
      const fields = [
        { name: 'avatar', maxCount: 1 },
        { name: 'gallery', maxCount: 5 }
      ];

      // Act
      const middleware = upload.fields(fields);

      // Assert
      expect(mockMulterInstance.fields).toHaveBeenCalledWith(fields);
      expect(typeof middleware).toBe('function');
    });
  });

  describe('fileFilter function', () => {
    it('should accept valid image files', () => {
      // Arrange
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg'
      };
      const cb = jest.fn();

      // Get the actual fileFilter from upload config
      const multerConfig = multer.mock.calls[0][0];
      const fileFilter = multerConfig.fileFilter;

      // Act
      fileFilter(null, file, cb);

      // Assert
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept valid PDF files', () => {
      // Arrange
      const file = {
        mimetype: 'application/pdf',
        originalname: 'document.pdf'
      };
      const cb = jest.fn();

      const multerConfig = multer.mock.calls[0][0];
      const fileFilter = multerConfig.fileFilter;

      // Act
      fileFilter(null, file, cb);

      // Assert
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject invalid file types', () => {
      // Arrange
      const file = {
        mimetype: 'application/exe',
        originalname: 'malware.exe'
      };
      const cb = jest.fn();

      const multerConfig = multer.mock.calls[0][0];
      const fileFilter = multerConfig.fileFilter;

      // Act
      fileFilter(null, file, cb);

      // Assert
      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid file type'),
          statusCode: 400
        }),
        false
      );
    });

    it('should reject files that are too large (handled by limits)', () => {
      // Note: File size validation is handled by multer limits, not fileFilter
      // This test ensures we have limits configured
      const multerConfig = multer.mock.calls[0][0];
      expect(multerConfig.limits.fileSize).toBe(5 * 1024 * 1024); // 5MB
    });

    it('should handle null file', () => {
      // Arrange
      const cb = jest.fn();
      const multerConfig = multer.mock.calls[0][0];
      const fileFilter = multerConfig.fileFilter;

      // Act
      fileFilter(null, null, cb);

      // Assert
      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('No file provided')
        }),
        false
      );
    });
  });

  describe('storage configuration', () => {
    it('should configure disk storage with destination and filename', () => {
      // Trigger storage configuration by calling single
      upload.single('test');

      // Get storage configuration
      const multerConfig = multer.mock.calls[0][0];
      const storage = multerConfig.storage;
      
      expect(storage).toBeDefined();
      
      // Test destination function
      const req = {};
      const file = { originalname: 'test.jpg' };
      const cb = jest.fn();
      
      storage.destination(req, file, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('uploads'));
      
      // Test filename function
      storage.filename(req, file, cb);
      const filename = cb.mock.calls[0][1];
      expect(filename).toMatch(/^[\w-]+\.jpg$/);
      expect(filename).not.toContain(' '); // No spaces in filename
    });

    it('should generate unique filenames', () => {
      // Trigger storage configuration
      upload.single('test');
      
      const multerConfig = multer.mock.calls[0][0];
      const storage = multerConfig.storage;
      
      const req = {};
      const file1 = { originalname: 'test.jpg' };
      const file2 = { originalname: 'test.jpg' };
      const cb = jest.fn();
      
      // Call filename twice with same originalname
      storage.filename(req, file1, cb);
      const filename1 = cb.mock.calls[0][1];
      
      cb.mockClear();
      storage.filename(req, file2, cb);
      const filename2 = cb.mock.calls[0][1];
      
      // Filenames should be different (due to timestamp/randomness)
      expect(filename1).not.toBe(filename2);
    });

    it('should sanitize filenames', () => {
      // Trigger storage configuration
      upload.single('test');
      
      const multerConfig = multer.mock.calls[0][0];
      const storage = multerConfig.storage;
      
      const req = {};
      const file = { originalname: 'Test File With Spaces & Special@Characters.jpg' };
      const cb = jest.fn();
      
      storage.filename(req, file, cb);
      const filename = cb.mock.calls[0][1];
      
      // Should not contain spaces or special characters
      expect(filename).not.toContain(' ');
      expect(filename).not.toContain('@');
      expect(filename).toMatch(/^[\w-]+\.jpg$/);
    });
  });
});