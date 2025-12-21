
jest.mock('../../../src/services/PaymentService');
jest.mock('../../../src/prisma', () => ({
    wallet: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    transaction: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() }
}));

const walletController = require('../../../src/controllers/walletController');
const PaymentService = require('../../../src/services/PaymentService');
const prisma = require('../../../src/prisma');

describe('Wallet Controller Unit Tests', () => {
    let req, res, next;
    beforeEach(() => {
        jest.clearAllMocks();
        req = { user: { id: 'u1' }, body: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        next = jest.fn();
    });

    it('getBalance success', async () => {
        prisma.wallet.findUnique.mockResolvedValue({ balance: 100 });
        await walletController.getBalance(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('topup success', async () => {
        req.body = { amount: 100 };
        prisma.wallet.findUnique.mockResolvedValue({ id: 'w1' });
        PaymentService.createPaymentSession.mockResolvedValue({ sessionId: 's1' });
        await walletController.topup(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
