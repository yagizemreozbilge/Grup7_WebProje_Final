const QRCodeService = require('../../src/services/QRCodeService');

describe('QRCodeService', () => {
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
    });

    describe('generateEventQRCode', () => {
        it('should generate a code starting with EVENT-', () => {
            const code = QRCodeService.generateEventQRCode();
            expect(code.startsWith('EVENT-')).toBe(true);
        });
    });

    describe('validateQRCode', () => {
        it('should validate a correct meal QR code', () => {
            const code = QRCodeService.generateMealQRCode();
            const result = QRCodeService.validateQRCode(code, 'meal');
            expect(result.valid).toBe(true);
        });

        it('should return error for invalid prefix', () => {
            const code = 'INVALID-UUID';
            const result = QRCodeService.validateQRCode(code, 'meal');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid meal QR code format');
        });

        it('should return error for invalid UUID format', () => {
            const code = 'MEAL-not-a-uuid';
            const result = QRCodeService.validateQRCode(code, 'meal');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid UUID');
        });

        it('should validate type mismatch', () => {
            const code = QRCodeService.generateEventQRCode();
            const result = QRCodeService.validateQRCode(code, 'meal');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid meal QR code format');
        });
    });
});
