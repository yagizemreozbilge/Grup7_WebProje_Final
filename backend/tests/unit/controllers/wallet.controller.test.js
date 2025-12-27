
jest.mock('../../../src/services/PaymentService');
jest.mock('../../../src/prisma', () => ({
    wallet: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    transaction: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
    user: { findUnique: jest.fn() }
}));

const walletController = require('../../../src/controllers/walletController');
const PaymentService = require('../../../src/services/PaymentService');
const prisma = require('../../../src/prisma');

describe('Wallet Controller Unit Tests', () => {
    let req, res, next;
    beforeEach(() => {
        jest.clearAllMocks();
        req = { user: { id: 'u1' }, body: {}, params: {}, query: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        next = jest.fn();
    });

    describe('getBalance', () => {
        it('should get balance successfully (200)', async () => {
            const mockWallet = { id: 'w1', balance: 100, currency: 'TRY' };
            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            await walletController.getBalance(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockWallet
            });
        });

        it('should create wallet if not exists', async () => {
            const mockWallet = { id: 'w1', balance: 0, currency: 'TRY', isActive: true };
            prisma.wallet.findUnique.mockResolvedValue(null);
            prisma.wallet.create.mockResolvedValue(mockWallet);
            await walletController.getBalance(req, res, next);
            expect(prisma.wallet.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should call next with error on failure', async () => {
            const error = new Error('DB Error');
            prisma.wallet.findUnique.mockRejectedValue(error);
            await walletController.getBalance(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('topup', () => {
        it('should create topup session successfully (200)', async () => {
            req.body = { amount: 100 };
            const mockWallet = { id: 'w1', balance: 50 };
            const mockPaymentSession = {
                sessionId: 'sess1',
                paymentUrl: 'https://payment.url',
                expiresAt: new Date()
            };
            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            PaymentService.createPaymentSession.mockResolvedValue(mockPaymentSession);
            prisma.transaction.create.mockResolvedValue({ id: 't1' });

            await walletController.topup(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    sessionId: 'sess1',
                    amount: 100
                })
            });
        });

        it('should return 400 if amount less than minimum', async () => {
            req.body = { amount: 30 };
            await walletController.topup(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Minimum top-up amount is 50 TRY'
            });
        });

        it('should create wallet if not exists', async () => {
            req.body = { amount: 100 };
            const mockWallet = { id: 'w1', balance: 0 };
            prisma.wallet.findUnique.mockResolvedValue(null);
            prisma.wallet.create.mockResolvedValue(mockWallet);
            PaymentService.createPaymentSession.mockResolvedValue({ sessionId: 's1' });
            prisma.transaction.create.mockResolvedValue({ id: 't1' });

            await walletController.topup(req, res, next);

            expect(prisma.wallet.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should call next with error on failure', async () => {
            req.body = { amount: 100 };
            const error = new Error('DB Error');
            prisma.wallet.findUnique.mockRejectedValue(error);
            await walletController.topup(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('topupWebhook', () => {
        it('should process payment successfully (200)', async () => {
            req.body = {
                sessionId: 'topup_u1_123',
                amount: 100,
                status: 'success',
                signature: 'valid_signature'
            };
            const mockWallet = { id: 'w1', balance: 50 };
            const mockUser = { id: 'u1', email: 'test@example.com' };

            PaymentService.verifyWebhookSignature.mockReturnValue(true);
            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            PaymentService.processPayment.mockResolvedValue();
            prisma.user.findUnique.mockResolvedValue(mockUser);

            await walletController.topupWebhook(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(PaymentService.processPayment).toHaveBeenCalled();
        });

        it('should return 401 if signature invalid', async () => {
            req.body = {
                sessionId: 'topup_u1_123',
                amount: 100,
                status: 'success',
                signature: 'invalid_signature'
            };
            PaymentService.verifyWebhookSignature.mockReturnValue(false);

            await walletController.topupWebhook(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid signature'
            });
        });

        it('should return 400 if payment failed', async () => {
            req.body = {
                sessionId: 'topup_u1_123',
                amount: 100,
                status: 'failed',
                signature: 'valid_signature'
            };
            PaymentService.verifyWebhookSignature.mockReturnValue(true);

            await walletController.topupWebhook(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Payment failed'
            });
        });

        it('should return 404 if wallet not found', async () => {
            req.body = {
                sessionId: 'topup_u1_123',
                amount: 100,
                status: 'success',
                signature: 'valid_signature'
            };
            PaymentService.verifyWebhookSignature.mockReturnValue(true);
            prisma.wallet.findUnique.mockResolvedValue(null);

            await walletController.topupWebhook(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should call next with error on failure', async () => {
            req.body = {
                sessionId: 'topup_u1_123',
                amount: 100,
                status: 'success',
                signature: 'valid_signature'
            };
            const error = new Error('DB Error');
            PaymentService.verifyWebhookSignature.mockReturnValue(true);
            prisma.wallet.findUnique.mockRejectedValue(error);

            await walletController.topupWebhook(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getTransactions', () => {
        it('should get transactions successfully (200)', async () => {
            req.query = { page: '1', limit: '20' };
            const mockWallet = { id: 'w1', balance: 100 };
            const mockTransactions = [
                { id: 't1', type: 'credit', amount: 100 },
                { id: 't2', type: 'debit', amount: 50 }
            ];

            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            prisma.transaction.findMany.mockResolvedValue(mockTransactions);
            prisma.transaction.count.mockResolvedValue(2);

            await walletController.getTransactions(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockTransactions,
                pagination: expect.objectContaining({
                    page: 1,
                    limit: 20,
                    total: 2,
                    pages: 1
                })
            });
        });

        it('should filter transactions by type', async () => {
            req.query = { page: '1', limit: '20', type: 'credit' };
            const mockWallet = { id: 'w1' };
            prisma.wallet.findUnique.mockResolvedValue(mockWallet);
            prisma.transaction.findMany.mockResolvedValue([]);
            prisma.transaction.count.mockResolvedValue(0);

            await walletController.getTransactions(req, res, next);

            expect(prisma.transaction.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        walletId: 'w1',
                        type: 'credit'
                    })
                })
            );
        });

        it('should return 404 if wallet not found', async () => {
            req.query = { page: '1', limit: '20' };
            prisma.wallet.findUnique.mockResolvedValue(null);

            await walletController.getTransactions(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Wallet not found'
            });
        });

        it('should call next with error on failure', async () => {
            req.query = { page: '1', limit: '20' };
            const error = new Error('DB Error');
            prisma.wallet.findUnique.mockRejectedValue(error);

            await walletController.getTransactions(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
