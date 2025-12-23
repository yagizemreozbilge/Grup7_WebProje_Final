const prisma = require('../prisma');

class PaymentService {
  /**
   * Create a payment session (Stripe/PayTR integration placeholder)
   * In production, integrate with actual payment gateway
   */
  static async createPaymentSession(amount, currency = 'TRY', userId, description) {
    // TODO: Integrate with Stripe or PayTR
    // For now, return a mock payment URL
    const sessionId = `payment_${Date.now()}_${userId}`;

    // Use relative path or frontend URL - frontend nginx will proxy to backend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const paymentUrl = `${frontendUrl}/payment/${sessionId}`;

    return {
      sessionId,
      paymentUrl,
      amount,
      currency,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    };
  }

  /**
   * Verify payment webhook signature
   */
  static verifyWebhookSignature(signature, payload, secret) {
    // TODO: Implement actual signature verification
    // For now, return true (mock)
    return true;
  }

  /**
   * Process successful payment
   */
  static async processPayment(walletId, amount, referenceType, referenceId, description) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            increment: amount
          }
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          walletId: walletId,
          type: 'credit',
          amount,
          balanceAfter: updatedWallet.balance,
          referenceType: referenceType,
          referenceId: referenceId,
          description
        }
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  /**
   * Deduct from wallet (for meal/event payment)
   */
  static async deductFromWallet(walletId, amount, referenceType, referenceId, description) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            decrement: amount
          }
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          walletId: walletId,
          type: 'debit',
          amount,
          balanceAfter: updatedWallet.balance,
          referenceType: referenceType,
          referenceId: referenceId,
          description
        }
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  /**
   * Refund to wallet
   */
  static async refundToWallet(walletId, amount, referenceType, referenceId, description) {
    return await this.processPayment(walletId, amount, referenceType, referenceId, description);
  }
}

module.exports = PaymentService;





