const { v4: uuidv4 } = require('uuid');

class QRCodeService {
  /**
   * Generate a unique QR code for meal reservation
   * Format: MEAL-{UUID}
   */
  static generateMealQRCode() {
    return `MEAL-${uuidv4()}`;
  }

  /**
   * Generate a unique QR code for event registration
   * Format: EVENT-{UUID}
   */
  static generateEventQRCode() {
    return `EVENT-${uuidv4()}`;
  }

  /**
   * Validate QR code format
   */
  static validateQRCode(qrCode, type) {
    if (!qrCode || typeof qrCode !== 'string') {
      return { valid: false, error: 'Invalid QR code format' };
    }

    if (type === 'meal' && !qrCode.startsWith('MEAL-')) {
      return { valid: false, error: 'Invalid meal QR code format' };
    }

    if (type === 'event' && !qrCode.startsWith('EVENT-')) {
      return { valid: false, error: 'Invalid event QR code format' };
    }

    // Extract UUID part
    const uuidPart = qrCode.split('-').slice(1).join('-');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(uuidPart)) {
      return { valid: false, error: 'Invalid UUID format in QR code' };
    }

    return { valid: true };
  }

  /**
   * Extract UUID from QR code
   */
  static extractUUID(qrCode) {
    if (!qrCode) return null;
    const parts = qrCode.split('-');
    if (parts.length < 2) return null;
    return parts.slice(1).join('-');
  }
}

module.exports = QRCodeService;

