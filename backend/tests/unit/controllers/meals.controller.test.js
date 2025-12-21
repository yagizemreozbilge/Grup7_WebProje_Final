jest.mock('../../../src/services/QRCodeService');
jest.mock('../../../src/services/PaymentService');
jest.mock('../../../src/services/NotificationService');
jest.mock('../../../src/prisma', () => ({
    mealMenu: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    mealReservation: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn()
    },
    user: {
        findMany: jest.fn(),
        findUnique: jest.fn()
    },
    wallet: {
        findUnique: jest.fn()
    },
    transaction: {
        create: jest.fn()
    }
}));

const mealsController = require('../../../src/controllers/mealsController');
const QRCodeService = require('../../../src/services/QRCodeService');
const PaymentService = require('../../../src/services/PaymentService');
const NotificationService = require('../../../src/services/NotificationService');
const prisma = require('../../../src/prisma');

describe('Meals Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { id: 'user123', role: 'student' },
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('getMenus', () => {
        it('should get all published menus (200)', async () => {
            const mockMenus = [
                { id: 'm1', meal_type: 'lunch', is_published: true, cafeteria: { id: 'c1', name: 'Main' } }
            ];
            prisma.mealMenu.findMany.mockResolvedValue(mockMenus);

            await mealsController.getMenus(req, res, next);

            expect(prisma.mealMenu.findMany).toHaveBeenCalledWith({
                where: { is_published: true },
                include: { cafeteria: expect.any(Object) },
                orderBy: [{ date: 'asc' }, { meal_type: 'asc' }]
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockMenus });
        });

        it('should filter menus by date', async () => {
            req.query.date = '2025-01-01';
            prisma.mealMenu.findMany.mockResolvedValue([]);

            await mealsController.getMenus(req, res, next);

            expect(prisma.mealMenu.findMany).toHaveBeenCalledWith({
                where: { is_published: true, date: new Date('2025-01-01') },
                include: expect.any(Object),
                orderBy: expect.any(Array)
            });
        });

        it('should filter menus by cafeteria_id and meal_type', async () => {
            req.query.cafeteria_id = 'c1';
            req.query.meal_type = 'lunch';
            prisma.mealMenu.findMany.mockResolvedValue([]);

            await mealsController.getMenus(req, res, next);

            expect(prisma.mealMenu.findMany).toHaveBeenCalledWith({
                where: { is_published: true, cafeteria_id: 'c1', meal_type: 'lunch' },
                include: expect.any(Object),
                orderBy: expect.any(Array)
            });
        });

        it('should call next with error on failure', async () => {
            const error = new Error('DB Error');
            prisma.mealMenu.findMany.mockRejectedValue(error);

            await mealsController.getMenus(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getMenuById', () => {
        it('should get menu by id successfully (200)', async () => {
            req.params.id = 'm1';
            const mockMenu = { id: 'm1', meal_type: 'lunch', cafeteria: {} };
            prisma.mealMenu.findUnique.mockResolvedValue(mockMenu);

            await mealsController.getMenuById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockMenu });
        });

        it('should return 404 if menu not found', async () => {
            req.params.id = 'm1';
            prisma.mealMenu.findUnique.mockResolvedValue(null);

            await mealsController.getMenuById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Menu not found' });
        });

        it('should call next with error on failure', async () => {
            req.params.id = 'm1';
            const error = new Error('DB Error');
            prisma.mealMenu.findUnique.mockRejectedValue(error);

            await mealsController.getMenuById(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('createMenu', () => {
        it('should create menu successfully (201)', async () => {
            req.body = {
                cafeteria_id: 'c1',
                date: '2025-01-01',
                meal_type: 'lunch',
                items_json: { items: ['item1'] },
                nutrition_json: {},
                is_published: true
            };
            const mockMenu = { id: 'm1', ...req.body };
            prisma.mealMenu.create.mockResolvedValue(mockMenu);

            await mealsController.createMenu(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockMenu });
        });

        it('should create unpublished menu by default', async () => {
            req.body = {
                cafeteria_id: 'c1',
                date: '2025-01-01',
                meal_type: 'lunch'
            };
            prisma.mealMenu.create.mockResolvedValue({ id: 'm1' });

            await mealsController.createMenu(req, res, next);

            expect(prisma.mealMenu.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ is_published: false }),
                include: { cafeteria: true }
            });
        });

        it('should call next with error on creation failure', async () => {
            req.body = { cafeteria_id: 'c1' };
            const error = new Error('Creation failed');
            prisma.mealMenu.create.mockRejectedValue(error);

            await mealsController.createMenu(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('updateMenu', () => {
        it('should update menu successfully (200)', async () => {
            req.params.id = 'm1';
            req.body = { meal_type: 'dinner', is_published: true };
            const mockMenu = { id: 'm1', ...req.body };
            prisma.mealMenu.update.mockResolvedValue(mockMenu);

            await mealsController.updateMenu(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockMenu });
        });

        it('should convert date when updating', async () => {
            req.params.id = 'm1';
            req.body = { date: '2025-02-01' };
            prisma.mealMenu.update.mockResolvedValue({ id: 'm1' });

            await mealsController.updateMenu(req, res, next);

            expect(prisma.mealMenu.update).toHaveBeenCalledWith({
                where: { id: 'm1' },
                data: { date: expect.any(Date) },
                include: { cafeteria: true }
            });
        });

        it('should call next with error on update failure', async () => {
            req.params.id = 'm1';
            req.body = { meal_type: 'dinner' };
            const error = new Error('Update failed');
            prisma.mealMenu.update.mockRejectedValue(error);

            await mealsController.updateMenu(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('deleteMenu', () => {
        it('should delete menu successfully (200)', async () => {
            req.params.id = 'm1';
            prisma.mealMenu.delete.mockResolvedValue({ id: 'm1' });

            await mealsController.deleteMenu(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Menu deleted successfully' });
        });

        it('should call next with error on deletion failure', async () => {
            req.params.id = 'm1';
            const error = new Error('Deletion failed');
            prisma.mealMenu.delete.mockRejectedValue(error);

            await mealsController.deleteMenu(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('createReservation', () => {
        const mockUser = {
            id: 'user123',
            email: 'test@example.com',
            role: 'student',
            student: { id: 'st1' }
        };

        const mockMenu = {
            id: 'm1',
            meal_type: 'lunch',
            cafeteria_id: 'c1'
        };

        it('should create reservation for scholarship student (201)', async () => {
            req.body = {
                menu_id: 'm1',
                cafeteria_id: 'c1',
                meal_type: 'lunch',
                date: '2025-01-01',
                amount: 0
            };
            prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma.mealMenu.findUnique.mockResolvedValue(mockMenu);
            prisma.mealReservation.count.mockResolvedValue(0);
            QRCodeService.generateMealQRCode.mockReturnValue('QR123');
            
            const mockReservation = {
                id: 'res1',
                user: { id: 'user123', email: 'test@example.com', fullName: 'Test User' },
                menu: { cafeteria: {} }
            };
            prisma.mealReservation.create.mockResolvedValue(mockReservation);
            NotificationService.sendMealReservationConfirmation.mockResolvedValue();

            await mealsController.createReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockReservation });
        });

        it('should return 404 if user not found', async () => {
            req.body = { menu_id: 'm1' };
            prisma.user.findUnique.mockResolvedValue(null);

            await mealsController.createReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'User not found' });
        });

        it('should return 404 if menu not found', async () => {
            req.body = { menu_id: 'm1' };
            prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma.mealMenu.findUnique.mockResolvedValue(null);

            await mealsController.createReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Menu not found' });
        });

        it('should return 400 if daily quota exceeded for scholarship student', async () => {
            req.body = {
                menu_id: 'm1',
                date: '2025-01-01',
                amount: 0
            };
            prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma.mealMenu.findUnique.mockResolvedValue(mockMenu);
            prisma.mealReservation.count.mockResolvedValue(2);

            await mealsController.createReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Daily quota exceeded. Maximum 2 meals per day for scholarship students.'
            });
        });

        it('should return 400 if wallet not found for paid reservation', async () => {
            req.body = {
                menu_id: 'm1',
                date: '2025-01-01',
                amount: 50
            };
            const regularUser = { ...mockUser, student: null };
            prisma.user.findUnique.mockResolvedValue(regularUser);
            prisma.mealMenu.findUnique.mockResolvedValue(mockMenu);
            prisma.wallet.findUnique.mockResolvedValue(null);

            await mealsController.createReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Wallet not found' });
        });

        it('should return 400 if insufficient balance', async () => {
            req.body = {
                menu_id: 'm1',
                date: '2025-01-01',
                amount: 50
            };
            const regularUser = { ...mockUser, student: null };
            prisma.user.findUnique.mockResolvedValue(regularUser);
            prisma.mealMenu.findUnique.mockResolvedValue(mockMenu);
            prisma.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: 30 });

            await mealsController.createReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Insufficient balance' });
        });

        it('should call next with error on creation failure', async () => {
            req.body = { menu_id: 'm1' };
            const error = new Error('Creation failed');
            prisma.user.findUnique.mockRejectedValue(error);

            await mealsController.createReservation(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('cancelReservation', () => {
        const mockReservation = {
            id: 'res1',
            user_id: 'user123',
            status: 'reserved',
            amount: 50,
            date: new Date('2025-12-31T10:00:00'),
            meal_type: 'lunch',
            menu: {},
            user: { email: 'test@example.com' }
        };

        it('should cancel reservation successfully (200)', async () => {
            req.params.id = 'res1';
            prisma.mealReservation.findUnique.mockResolvedValue(mockReservation);
            prisma.wallet.findUnique.mockResolvedValue({ id: 'w1' });
            PaymentService.refundToWallet.mockResolvedValue();
            prisma.mealReservation.update.mockResolvedValue({ ...mockReservation, status: 'cancelled' });
            NotificationService.sendEmail.mockResolvedValue();

            await mealsController.cancelReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Reservation cancelled successfully' });
        });

        it('should return 404 if reservation not found', async () => {
            req.params.id = 'res1';
            prisma.mealReservation.findUnique.mockResolvedValue(null);

            await mealsController.cancelReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Reservation not found' });
        });

        it('should return 403 if unauthorized', async () => {
            req.params.id = 'res1';
            req.user.id = 'different-user';
            prisma.mealReservation.findUnique.mockResolvedValue(mockReservation);

            await mealsController.cancelReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized' });
        });

        it('should return 400 if status is not reserved', async () => {
            req.params.id = 'res1';
            prisma.mealReservation.findUnique.mockResolvedValue({ ...mockReservation, status: 'used' });

            await mealsController.cancelReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Only reserved reservations can be cancelled'
            });
        });

        it('should return 400 if less than 2 hours before meal time', async () => {
            req.params.id = 'res1';
            const soonDate = new Date();
            soonDate.setHours(soonDate.getHours() + 1);
            prisma.mealReservation.findUnique.mockResolvedValue({
                ...mockReservation,
                date: soonDate
            });

            await mealsController.cancelReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Reservations can only be cancelled at least 2 hours before meal time'
            });
        });

        it('should call next with error on cancellation failure', async () => {
            req.params.id = 'res1';
            const error = new Error('Cancellation failed');
            prisma.mealReservation.findUnique.mockRejectedValue(error);

            await mealsController.cancelReservation(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getMyReservations', () => {
        it('should get user reservations successfully (200)', async () => {
            const mockReservations = [
                { id: 'res1', user_id: 'user123', menu: { cafeteria: {} } }
            ];
            prisma.mealReservation.findMany.mockResolvedValue(mockReservations);

            await mealsController.getMyReservations(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockReservations });
        });

        it('should filter reservations by status and date', async () => {
            req.query = { status: 'reserved', date: '2025-01-01' };
            prisma.mealReservation.findMany.mockResolvedValue([]);

            await mealsController.getMyReservations(req, res, next);

            expect(prisma.mealReservation.findMany).toHaveBeenCalledWith({
                where: {
                    user_id: 'user123',
                    status: 'reserved',
                    date: new Date('2025-01-01')
                },
                include: expect.any(Object),
                orderBy: expect.any(Array)
            });
        });

        it('should call next with error on failure', async () => {
            const error = new Error('DB Error');
            prisma.mealReservation.findMany.mockRejectedValue(error);

            await mealsController.getMyReservations(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('useReservation', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const mockReservation = {
            id: 'res1',
            qr_code: 'QR123',
            status: 'reserved',
            date: today,
            amount: 50,
            meal_type: 'lunch',
            user: {
                wallet: { id: 'w1' }
            },
            menu: {}
        };

        it('should use reservation successfully (200)', async () => {
            req.params.id = 'res1';
            req.body = { qr_code: 'QR123' };
            prisma.mealReservation.findUnique.mockResolvedValue(mockReservation);
            prisma.mealReservation.update.mockResolvedValue({
                ...mockReservation,
                status: 'used',
                user: { id: 'user123', email: 'test@example.com', fullName: 'Test User' },
                menu: { cafeteria: {} }
            });
            PaymentService.deductFromWallet.mockResolvedValue();

            await mealsController.useReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.any(Object),
                message: 'Reservation used successfully'
            });
        });

        it('should return 404 if reservation not found', async () => {
            req.params.id = 'res1';
            req.body = { qr_code: 'QR123' };
            prisma.mealReservation.findUnique.mockResolvedValue(null);

            await mealsController.useReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Reservation not found' });
        });

        it('should return 400 if QR code is invalid', async () => {
            req.params.id = 'res1';
            req.body = { qr_code: 'WRONG_QR' };
            prisma.mealReservation.findUnique.mockResolvedValue(mockReservation);

            await mealsController.useReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid QR code' });
        });

        it('should return 400 if QR code is not valid for today', async () => {
            req.params.id = 'res1';
            req.body = { qr_code: 'QR123' };
            const oldDate = new Date('2020-01-01');
            prisma.mealReservation.findUnique.mockResolvedValue({
                ...mockReservation,
                date: oldDate
            });

            await mealsController.useReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'QR code is not valid for today'
            });
        });

        it('should return 400 if already used', async () => {
            req.params.id = 'res1';
            req.body = { qr_code: 'QR123' };
            prisma.mealReservation.findUnique.mockResolvedValue({
                ...mockReservation,
                status: 'used'
            });

            await mealsController.useReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Reservation already used'
            });
        });

        it('should call next with error on use failure', async () => {
            req.params.id = 'res1';
            req.body = { qr_code: 'QR123' };
            const error = new Error('Use failed');
            prisma.mealReservation.findUnique.mockRejectedValue(error);

            await mealsController.useReservation(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
