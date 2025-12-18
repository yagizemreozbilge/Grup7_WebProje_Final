const prisma = require('../prisma');
const PaymentService = require('../services/PaymentService');

const walletController = {
  // Get wallet balance
  async getBalance(req, res, next) {
    try {
      const userId = req.user.id;

      let wallet = await prisma.wallet.findUnique({
        where: { user_id: userId }
      });

      // Create wallet if doesn't exist
      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            user_id: userId,
            balance: 0,
            currency: 'TRY',
            is_active: true
          }
        });
      }

      res.status(200).json({ success: true, data: wallet });
    } catch (error) {
      next(error);
    }
  },

  // Top up wallet
  async topup(req, res, next) {
    try {
      const userId = req.user.id;
      const { amount } = req.body;

      if (!amount || amount < 50) {
        return res.status(400).json({
          success: false,
          error: 'Minimum top-up amount is 50 TRY'
        });
      }

      // Get or create wallet
      let wallet = await prisma.wallet.findUnique({
        where: { user_id: userId }
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            user_id: userId,
            balance: 0,
            currency: 'TRY',
            is_active: true
          }
        });
      }

      // Create payment session
      const paymentSession = await PaymentService.createPaymentSession(
        amount,
        'TRY',
        userId,
        `Wallet top-up - ${amount} TRY`
      );

      res.status(200).json({
        success: true,
        data: {
          sessionId: paymentSession.sessionId,
          paymentUrl: paymentSession.paymentUrl,
          amount,
          expiresAt: paymentSession.expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Webhook for payment gateway
  async topupWebhook(req, res, next) {
    try {
      const { sessionId, amount, status, signature } = req.body;

      // Verify signature
      const isValid = PaymentService.verifyWebhookSignature(
        signature,
        req.body,
        process.env.PAYMENT_WEBHOOK_SECRET || 'secret'
      );

      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid signature' });
      }

      if (status !== 'success') {
        return res.status(400).json({ success: false, error: 'Payment failed' });
      }

      // Extract userId from sessionId
      const userId = sessionId.split('_')[2];

      // Process payment
      const wallet = await prisma.wallet.findUnique({
        where: { user_id: userId }
      });

      if (!wallet) {
        return res.status(404).json({ success: false, error: 'Wallet not found' });
      }

      await PaymentService.processPayment(
        wallet.id,
        amount,
        'topup',
        null,
        `Wallet top-up - ${amount} TRY`
      );

      // Send confirmation email
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (user) {
        // TODO: Send email notification
        console.log(`Top-up successful for ${user.email}: ${amount} TRY`);
      }

      res.status(200).json({ success: true, message: 'Payment processed' });
    } catch (error) {
      next(error);
    }
  },

  // Get transaction history
  async getTransactions(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type } = req.query;

      const wallet = await prisma.wallet.findUnique({
        where: { user_id: userId }
      });

      if (!wallet) {
        return res.status(404).json({ success: false, error: 'Wallet not found' });
      }

      const where = { wallet_id: wallet.id };
      if (type) {
        where.type = type;
      }

      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });

      const total = await prisma.transaction.count({ where });

      res.status(200).json({
        success: true,
        data: transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = walletController;


