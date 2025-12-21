jest.mock('../../src/prisma', () => ({
    wallet: {
        findUnique: jest.fn(),
        update: jest.fn()
    },
    transaction: {
        create: jest.fn()
    },
    $transaction: jest.fn((callback) => {
        const tx = require('../../src/prisma');
        return callback(tx);
    })
}));

const PaymentService = require('../../src/services/PaymentService');
const prisma = require('../../src/prisma');

describe('PaymentService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createPaymentSession', () => {
        it('should return a valid session object with all parameters', async () => {
            const amount = 100;
            const currency = 'USD';
            const userId = 'user-123';
            const description = 'Test payment';

            const session = await PaymentService.createPaymentSession(amount, currency, userId, description);
            
            expect(session).toHaveProperty('sessionId');
            expect(session.sessionId).toContain('payment_');
            expect(session.sessionId).toContain(userId);
            expect(session.amount).toBe(amount);
            expect(session.currency).toBe(currency);
            expect(session.paymentUrl).toContain('payment_');
            expect(session).toHaveProperty('expiresAt');
            expect(session.expiresAt).toBeInstanceOf(Date);
            
            const expectedExpiry = Date.now() + 15 * 60 * 1000;
            const timeDiff = Math.abs(session.expiresAt.getTime() - expectedExpiry);
            expect(timeDiff).toBeLessThan(1000);
        });

        it('should use default currency TRY when not provided', async () => {
            const session = await PaymentService.createPaymentSession(50, undefined, 'user-1');
            expect(session.currency).toBe('TRY');
            expect(session.amount).toBe(50);
        });

        it('should generate unique session IDs', async () => {
            const session1 = await PaymentService.createPaymentSession(100, 'TRY', 'user-1');
            await new Promise(resolve => setTimeout(resolve, 10));
            const session2 = await PaymentService.createPaymentSession(100, 'TRY', 'user-1');
            expect(session1.sessionId).not.toBe(session2.sessionId);
        });

        it('should use custom PAYMENT_GATEWAY_URL from environment', async () => {
            const originalEnv = process.env.PAYMENT_GATEWAY_URL;
            process.env.PAYMENT_GATEWAY_URL = 'https://custom-gateway.com';
            const session = await PaymentService.createPaymentSession(100, 'TRY', 'user-1');
            expect(session.paymentUrl).toContain('https://custom-gateway.com');
            if (originalEnv) {
                process.env.PAYMENT_GATEWAY_URL = originalEnv;
            } else {
                delete process.env.PAYMENT_GATEWAY_URL;
            }
        });

        it('should use default localhost URL when PAYMENT_GATEWAY_URL is not set', async () => {
            const originalEnv = process.env.PAYMENT_GATEWAY_URL;
            delete process.env.PAYMENT_GATEWAY_URL;
            const session = await PaymentService.createPaymentSession(100, 'TRY', 'user-1');
            expect(session.paymentUrl).toContain('http://localhost:5000');
            if (originalEnv) {
                process.env.PAYMENT_GATEWAY_URL = originalEnv;
            }
        });
    });

    describe('verifyWebhookSignature', () => {
        it('should return true (mock implementation)', () => {
            const result = PaymentService.verifyWebhookSignature('signature', 'payload', 'secret');
            expect(result).toBe(true);
        });

        it('should return true regardless of parameters', () => {
            expect(PaymentService.verifyWebhookSignature('', '', '')).toBe(true);
            expect(PaymentService.verifyWebhookSignature('sig1', 'payload1', 'secret1')).toBe(true);
            expect(PaymentService.verifyWebhookSignature(null, null, null)).toBe(true);
        });
    });

    describe('processPayment', () => {
        const walletId = 'wallet-123';
        const amount = 100.50;
        const referenceType = 'topup';
        const referenceId = 'ref-123';
        const description = 'Payment topup';

        it('should throw error if wallet not found', async () => {
            prisma.wallet.findUnique.mockResolvedValue(null);
            await expect(
                PaymentService.processPayment(walletId, amount, referenceType, referenceId, description)
            ).rejects.toThrow('Wallet not found');
            expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
                where: { id: walletId }
            });
        });

        it('should successfully process payment and update wallet balance', async () => {
            const initialBalance = 50.00;
            const expectedBalance = initialBalance + amount;
            const mockWallet = { id: walletId, balance: initialBalance };
            const updatedWallet = { id: walletId, balance: expectedBalance };
            const mockTransaction = {
                id: 'transaction-123',
                wallet_id: walletId,
                type: 'credit',
                amount: amount,
                balance_after: expectedBalance,
                reference_type: referenceType,
                reference_id: referenceId,
                description: description
            };

            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            prisma.wallet.update.mockResolvedValue(updatedWallet);
            prisma.transaction.create.mockResolvedValue(mockTransaction);

            const result = await PaymentService.processPayment(walletId, amount, referenceType, referenceId, description);

            expect(result).toHaveProperty('wallet');
            expect(result).toHaveProperty('transaction');
            expect(result.wallet).toEqual(updatedWallet);
            expect(result.transaction).toEqual(mockTransaction);
            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.wallet.update).toHaveBeenCalledWith({
                where: { id: walletId },
                data: {
                    balance: {
                        increment: amount
                    }
                }
            });
            expect(prisma.transaction.create).toHaveBeenCalledWith({
                data: {
                    wallet_id: walletId,
                    type: 'credit',
                    amount: amount,
                    balance_after: expectedBalance,
                    reference_type: referenceType,
                    reference_id: referenceId,
                    description: description
                }
            });
        });

        it('should handle payment with zero amount', async () => {
            const zeroAmount = 0;
            const initialBalance = 100.00;
            const mockWallet = { id: walletId, balance: initialBalance };
            const updatedWallet = { id: walletId, balance: initialBalance };
            const mockTransaction = {
                id: 'transaction-123',
                wallet_id: walletId,
                type: 'credit',
                amount: zeroAmount,
                balance_after: initialBalance,
                reference_type: referenceType,
                reference_id: referenceId,
                description: description
            };

            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            prisma.wallet.update.mockResolvedValue(updatedWallet);
            prisma.transaction.create.mockResolvedValue(mockTransaction);

            const result = await PaymentService.processPayment(walletId, zeroAmount, referenceType, referenceId, description);

            expect(result.wallet.balance).toBe(initialBalance);
            expect(result.transaction.amount).toBe(zeroAmount);
        });
    });

    describe('deductFromWallet', () => {
        const walletId = 'wallet-123';
        const amount = 50.25;
        const referenceType = 'meal_reservation';
        const referenceId = 'ref-456';
        const description = 'Meal payment';

        it('should throw error if wallet not found', async () => {
            prisma.wallet.findUnique.mockResolvedValue(null);
            await expect(
                PaymentService.deductFromWallet(walletId, amount, referenceType, referenceId, description)
            ).rejects.toThrow('Wallet not found');
            expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
                where: { id: walletId }
            });
        });

        it('should throw error if balance is insufficient', async () => {
            const lowBalance = 20.00;
            prisma.wallet.findUnique.mockResolvedValue({ id: walletId, balance: lowBalance });
            await expect(
                PaymentService.deductFromWallet(walletId, amount, referenceType, referenceId, description)
            ).rejects.toThrow('Insufficient balance');
        });

        it('should succeed when balance equals amount', async () => {
            const exactBalance = 50.25;
            const initialBalance = exactBalance;
            const expectedBalance = initialBalance - amount;
            const mockWallet = { id: walletId, balance: initialBalance };
            const updatedWallet = { id: walletId, balance: expectedBalance };
            const mockTransaction = {
                id: 'transaction-123',
                wallet_id: walletId,
                type: 'debit',
                amount: amount,
                balance_after: expectedBalance,
                reference_type: referenceType,
                reference_id: referenceId,
                description: description
            };

            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            prisma.wallet.update.mockResolvedValue(updatedWallet);
            prisma.transaction.create.mockResolvedValue(mockTransaction);

            const result = await PaymentService.deductFromWallet(walletId, amount, referenceType, referenceId, description);

            expect(result.wallet.balance).toBe(expectedBalance);
        });

        it('should successfully deduct from wallet and create transaction', async () => {
            const initialBalance = 100.00;
            const expectedBalance = initialBalance - amount;
            const mockWallet = { id: walletId, balance: initialBalance };
            const updatedWallet = { id: walletId, balance: expectedBalance };
            const mockTransaction = {
                id: 'transaction-123',
                wallet_id: walletId,
                type: 'debit',
                amount: amount,
                balance_after: expectedBalance,
                reference_type: referenceType,
                reference_id: referenceId,
                description: description
            };

            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            prisma.wallet.update.mockResolvedValue(updatedWallet);
            prisma.transaction.create.mockResolvedValue(mockTransaction);

            const result = await PaymentService.deductFromWallet(walletId, amount, referenceType, referenceId, description);

            expect(result).toHaveProperty('wallet');
            expect(result).toHaveProperty('transaction');
            expect(result.wallet).toEqual(updatedWallet);
            expect(result.transaction).toEqual(mockTransaction);
            expect(result.transaction.type).toBe('debit');
            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.wallet.update).toHaveBeenCalledWith({
                where: { id: walletId },
                data: {
                    balance: {
                        decrement: amount
                    }
                }
            });
            expect(prisma.transaction.create).toHaveBeenCalledWith({
                data: {
                    wallet_id: walletId,
                    type: 'debit',
                    amount: amount,
                    balance_after: expectedBalance,
                    reference_type: referenceType,
                    reference_id: referenceId,
                    description: description
                }
            });
        });

        it('should handle decimal amounts correctly', async () => {
            const decimalAmount = 15.99;
            const initialBalance = 100.50;
            const expectedBalance = initialBalance - decimalAmount;
            const mockWallet = { id: walletId, balance: initialBalance };
            const updatedWallet = { id: walletId, balance: expectedBalance };
            const mockTransaction = {
                id: 'transaction-123',
                wallet_id: walletId,
                type: 'debit',
                amount: decimalAmount,
                balance_after: expectedBalance,
                reference_type: referenceType,
                reference_id: referenceId,
                description: description
            };

            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            prisma.wallet.update.mockResolvedValue(updatedWallet);
            prisma.transaction.create.mockResolvedValue(mockTransaction);

            const result = await PaymentService.deductFromWallet(walletId, decimalAmount, referenceType, referenceId, description);

            expect(result.transaction.amount).toBe(decimalAmount);
            expect(result.wallet.balance).toBe(expectedBalance);
        });
    });

    describe('refundToWallet', () => {
        const walletId = 'wallet-123';
        const amount = 75.00;
        const referenceType = 'refund';
        const referenceId = 'ref-789';
        const description = 'Refund payment';

        it('should call processPayment internally', async () => {
            const initialBalance = 50.00;
            const expectedBalance = initialBalance + amount;
            const mockWallet = { id: walletId, balance: initialBalance };
            const updatedWallet = { id: walletId, balance: expectedBalance };
            const mockTransaction = {
                id: 'transaction-123',
                wallet_id: walletId,
                type: 'credit',
                amount: amount,
                balance_after: expectedBalance,
                reference_type: referenceType,
                reference_id: referenceId,
                description: description
            };

            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            prisma.wallet.update.mockResolvedValue(updatedWallet);
            prisma.transaction.create.mockResolvedValue(mockTransaction);

            const result = await PaymentService.refundToWallet(walletId, amount, referenceType, referenceId, description);

            expect(result).toHaveProperty('wallet');
            expect(result).toHaveProperty('transaction');
            expect(result.transaction.type).toBe('credit');
            expect(result.wallet.balance).toBe(expectedBalance);
            expect(prisma.wallet.update).toHaveBeenCalledWith({
                where: { id: walletId },
                data: {
                    balance: {
                        increment: amount
                    }
                }
            });
        });

        it('should throw error if wallet not found (via processPayment)', async () => {
            prisma.wallet.findUnique.mockResolvedValue(null);
            await expect(
                PaymentService.refundToWallet(walletId, amount, referenceType, referenceId, description)
            ).rejects.toThrow('Wallet not found');
        });
    });
});