const QRCodeService = require('../../src/services/QRCodeService');

describe('QRCodeService', () => {
    describe('generateUUID', () => {
        it('should generate a valid UUID v4', () => {
            const uuid = QRCodeService.generateUUID();
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        it('should generate unique UUIDs', () => {
            const uuid1 = QRCodeService.generateUUID();
            const uuid2 = QRCodeService.generateUUID();
            expect(uuid1).not.toBe(uuid2);
        });
    });

    describe('generateMealQRCode', () => {
        it('should generate a code starting with MEAL-', () => {
            const code = QRCodeService.generateMealQRCode();
            expect(code.startsWith('MEAL-')).toBe(true);
        });

        it('should contain a valid UUID', () => {
            const code = QRCodeService.generateMealQRCode();
            const uuid = code.split('-').slice(1).join('-');
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        it('should generate unique codes', () => {
            const code1 = QRCodeService.generateMealQRCode();
            const code2 = QRCodeService.generateMealQRCode();
            expect(code1).not.toBe(code2);
        });
    });

    describe('generateEventQRCode', () => {
        it('should generate a code starting with EVENT-', () => {
            const code = QRCodeService.generateEventQRCode();
            expect(code.startsWith('EVENT-')).toBe(true);
        });

        it('should contain a valid UUID', () => {
            const code = QRCodeService.generateEventQRCode();
            const uuid = code.split('-').slice(1).join('-');
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        it('should generate unique codes', () => {
            const code1 = QRCodeService.generateEventQRCode();
            const code2 = QRCodeService.generateEventQRCode();
            expect(code1).not.toBe(code2);
        });
    });

    describe('validateQRCode', () => {
        it('should validate a correct meal QR code', () => {
            const code = QRCodeService.generateMealQRCode();
            const result = QRCodeService.validateQRCode(code, 'meal');
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should validate a correct event QR code', () => {
            const code = QRCodeService.generateEventQRCode();
            const result = QRCodeService.validateQRCode(code, 'event');
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should return error for null qrCode', () => {
            const result = QRCodeService.validateQRCode(null, 'meal');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid QR code format');
        });

        it('should return error for undefined qrCode', () => {
            const result = QRCodeService.validateQRCode(undefined, 'meal');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid QR code format');
        });

        it('should return error for non-string qrCode', () => {
            const result = QRCodeService.validateQRCode(123, 'meal');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid QR code format');
        });

        it('should return error for empty string qrCode', () => {
            const result = QRCodeService.validateQRCode('', 'meal');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid QR code format');
        });

        it('should return error for invalid meal prefix', () => {
            const code = 'INVALID-UUID';
            const result = QRCodeService.validateQRCode(code, 'meal');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid meal QR code format');
        });

        it('should return error for invalid event prefix', () => {
            const code = 'INVALID-UUID';
            const result = QRCodeService.validateQRCode(code, 'event');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid event QR code format');
        });

        it('should return error for invalid UUID format in meal QR code', () => {
            const code = 'MEAL-not-a-uuid';
            const result = QRCodeService.validateQRCode(code, 'meal');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid UUID');
        });

        it('should return error for invalid UUID format in event QR code', () => {
            const code = 'EVENT-not-a-uuid';
            const result = QRCodeService.validateQRCode(code, 'event');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid UUID');
        });

        it('should return error when meal QR code used with event type', () => {
            const code = QRCodeService.generateMealQRCode();
            const result = QRCodeService.validateQRCode(code, 'event');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid event QR code format');
        });

        it('should return error when event QR code used with meal type', () => {
            const code = QRCodeService.generateEventQRCode();
            const result = QRCodeService.validateQRCode(code, 'meal');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid meal QR code format');
        });
    });

    describe('extractUUID', () => {
        it('should extract UUID from valid meal QR code', () => {
            const code = QRCodeService.generateMealQRCode();
            const uuid = QRCodeService.extractUUID(code);
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            expect(uuid).toBe(code.split('-').slice(1).join('-'));
        });

        it('should extract UUID from valid event QR code', () => {
            const code = QRCodeService.generateEventQRCode();
            const uuid = QRCodeService.extractUUID(code);
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            expect(uuid).toBe(code.split('-').slice(1).join('-'));
        });

        it('should return null for null input', () => {
            const uuid = QRCodeService.extractUUID(null);
            expect(uuid).toBeNull();
        });

        it('should return null for undefined input', () => {
            const uuid = QRCodeService.extractUUID(undefined);
            expect(uuid).toBeNull();
        });

        it('should return null for empty string', () => {
            const uuid = QRCodeService.extractUUID('');
            expect(uuid).toBeNull();
        });

        it('should return null for string without dash separator', () => {
            const uuid = QRCodeService.extractUUID('NODASH');
            expect(uuid).toBeNull();
        });

        it('should return null for string with only one part (no dash)', () => {
            const uuid = QRCodeService.extractUUID('SINGLE');
            expect(uuid).toBeNull();
        });

        it('should extract UUID correctly from format with prefix', () => {
            const testCode = 'PREFIX-123e4567-e89b-12d3-a456-426614174000';
            const uuid = QRCodeService.extractUUID(testCode);
            expect(uuid).toBe('123e4567-e89b-12d3-a456-426614174000');
        });
    });
});
