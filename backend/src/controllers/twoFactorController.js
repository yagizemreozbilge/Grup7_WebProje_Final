const TwoFactorService = require('../services/twoFactorService');
const prisma = require('../prisma');

const twoFactorController = {
  // Generate 2FA secret and QR code
  async generateSecret(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const secret = TwoFactorService.generateSecret(user.email);
      const qrCode = await TwoFactorService.generateQRCode(secret);

      // Store secret temporarily (user needs to verify before enabling)
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret.base32 }
      });

      res.status(200).json({
        success: true,
        data: {
          secret: secret.base32,
          qrCode: qrCode,
          manualEntryKey: secret.base32
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Verify and enable 2FA
  async verifyAndEnable(req, res, next) {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ success: false, error: 'Token is required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorSecret: true }
      });

      if (!user || !user.twoFactorSecret) {
        return res.status(400).json({ success: false, error: '2FA secret not found. Please generate first.' });
      }

      const isValid = TwoFactorService.verifyToken(
        { base32: user.twoFactorSecret },
        token
      );

      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Invalid token' });
      }

      // Enable 2FA
      await TwoFactorService.enable2FA(userId, { base32: user.twoFactorSecret });

      res.status(200).json({
        success: true,
        message: '2FA enabled successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Disable 2FA
  async disable(req, res, next) {
    try {
      const userId = req.user.id;
      await TwoFactorService.disable2FA(userId);

      res.status(200).json({
        success: true,
        message: '2FA disabled successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Verify token during login
  async verifyToken(req, res, next) {
    try {
      const { userId, token } = req.body;

      if (!userId || !token) {
        return res.status(400).json({ success: false, error: 'UserId and token are required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorSecret: true, twoFactorEnabled: true }
      });

      if (!user || !user.twoFactorEnabled) {
        return res.status(400).json({ success: false, error: '2FA is not enabled for this user' });
      }

      const isValid = TwoFactorService.verifyToken(
        { base32: user.twoFactorSecret },
        token
      );

      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Invalid token' });
      }

      res.status(200).json({
        success: true,
        message: 'Token verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = twoFactorController;









