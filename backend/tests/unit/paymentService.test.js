const PaymentService = require('../../src/services/PaymentService');
const prisma = require('../../src/prisma');

// Mock Prisma
jest.mock('../../src/prisma', () => ({
    wallet: {
        findUnique: jest.fn(),
        update: jest.fn()
    },
    transaction: {
        create: jest.fn()
    },
    $transaction: jest.fn((callback) => callback(require('../../src/prisma')))
}));

describe('PaymentService Unit Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createPaymentSession', () => {
        it('should return a valid session object', async () => {
            const session = await PaymentService.createPaymentSession(100, 'TRY', 'user-1');
            expect(session).toHaveProperty('sessionId');
            expect(session.amount).toBe(100);
            expect(session.currency).toBe('TRY');
            expect(session.paymentUrl).toContain('payment_');
        });
    });

    describe('deductFromWallet', () => {
        it('should throw error if wallet not found', async () => {
            prisma.wallet.findUnique.mockResolvedValue(null);

            await expect(PaymentService.deductFromWallet(1, 50, 'TEST', '1', 'Desc'))
                .rejects.toThrow('Wallet not found');
        });

        it('should throw error if balance is insufficient', async () => {
            prisma.wallet.findUnique.mockResolvedValue({ id: 1, balance: 20.00 }); // Low balance

            await expect(PaymentService.deductFromWallet(1, 50, 'TEST', '1', 'Desc'))
                .rejects.toThrow('Insufficient balance');
        });

        it('should proceed if balance is sufficient', async () => {
            const mockWallet = { id: 1, balance: 100.00 };
            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            prisma.wallet.update.mockResolvedValue({ id: 1, balance: 50.00 });
            prisma.transaction.create.mockResolvedValue({ id: 99 });

            // We mock $transaction to just run the callback
            // So we need to ensure the callback uses the mocked functions

            const result = await PaymentService.deductFromWallet(1, 50, 'TEST', '1', 'Desc');

            expect(result).toHaveProperty('wallet');
            expect(prisma.wallet.update).toHaveBeenCalled();
        });
    });
});
