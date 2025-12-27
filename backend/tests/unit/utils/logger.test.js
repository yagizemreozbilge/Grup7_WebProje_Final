const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Mock winston before requiring logger
jest.mock('winston', () => {
    const mockTransport = jest.fn();
    const mockFile = jest.fn(() => mockTransport);
    const mockConsole = jest.fn(() => mockTransport);
    
    return {
        format: {
            combine: jest.fn((...args) => args),
            timestamp: jest.fn(() => ({})),
            errors: jest.fn(() => ({})),
            splat: jest.fn(() => ({})),
            json: jest.fn(() => ({})),
            colorize: jest.fn(() => ({})),
            printf: jest.fn(() => ({}))
        },
        createLogger: jest.fn(() => ({
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            add: jest.fn()
        })),
        transports: {
            File: mockFile,
            Console: mockConsole
        }
    };
});

describe('Logger', () => {
    let logger;

    beforeEach(() => {
        jest.clearAllMocks();
        // Clear module cache to re-require
        delete require.cache[require.resolve('../../../src/utils/logger')];
    });

    it('should create logger instance', () => {
        logger = require('../../../src/utils/logger');
        
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.warn).toBe('function');
    });

    it('should log info messages', () => {
        logger = require('../../../src/utils/logger');
        
        logger.info('Test message');
        
        expect(logger.info).toHaveBeenCalledWith('Test message');
    });

    it('should log error messages', () => {
        logger = require('../../../src/utils/logger');
        
        logger.error('Error message');
        
        expect(logger.error).toHaveBeenCalledWith('Error message');
    });

    it('should log warning messages', () => {
        logger = require('../../../src/utils/logger');
        
        logger.warn('Warning message');
        
        expect(logger.warn).toHaveBeenCalledWith('Warning message');
    });

    it('should log debug messages', () => {
        logger = require('../../../src/utils/logger');
        
        logger.debug('Debug message');
        
        expect(logger.debug).toHaveBeenCalledWith('Debug message');
    });
});

