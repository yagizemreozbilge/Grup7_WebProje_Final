const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const prisma = require('../prisma');

class TwoFactorService {
  /**
   * Generate a secret for 2FA
   */
  static generateSecret(userEmail) {
    return speakeasy.generateSecret({
      name: `Campus Management System (${userEmail})`,
      issuer: 'Campus Management System'
    });
  }

  /**
   * Generate QR code data URL for authenticator app
   */
  static async generateQRCode(secret) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);
      return qrCodeDataURL;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify TOTP token
   */
  static verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) tolerance
    });
  }

  /**
   * Enable 2FA for user
   */
  static async enable2FA(userId, secret) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret.base32
      }
    });
  }

  /**
   * Disable 2FA for user
   */
  static async disable2FA(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    });
  }

  /**
   * Get user's 2FA secret
   */
  static async getUserSecret(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true }
    });
    return user?.twoFactorSecret;
  }
}

module.exports = TwoFactorService;




