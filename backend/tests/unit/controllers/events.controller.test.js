jest.mock('../../../src/services/QRCodeService');
jest.mock('../../../src/services/PaymentService');
jest.mock('../../../src/services/NotificationService');
jest.mock('../../../src/prisma', () => ({
    event: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    eventRegistration: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn()
    },
    eventWaitlist: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn()
    },
    wallet: {
        findUnique: jest.fn()
    },
    user: {
        findUnique: jest.fn()
    },
    $transaction: jest.fn()
}));

const eventsController = require('../../../src/controllers/eventsController');
const QRCodeService = require('../../../src/services/QRCodeService');
const PaymentService = require('../../../src/services/PaymentService');
const NotificationService = require('../../../src/services/NotificationService');

describe('Events Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { id: 'user123' },
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

    describe('getEvents', () => {
        it('should get all published events (200)', async () => {
            const mockEvents = [
                { id: 'e1', title: 'Event 1', status: 'published' }
            ];
            prisma.event.findMany.mockResolvedValue(mockEvents);

            await eventsController.getEvents(req, res, next);

            expect(prisma.event.findMany).toHaveBeenCalledWith({
                where: { status: 'published' },
                orderBy: [{ date: 'asc' }, { start_time: 'asc' }]
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockEvents
            });
        });

        it('should filter events by category', async () => {
            req.query.category = 'seminar';
            prisma.event.findMany.mockResolvedValue([]);

            await eventsController.getEvents(req, res, next);

            expect(prisma.event.findMany).toHaveBeenCalledWith({
                where: { category: 'seminar', status: 'published' },
                orderBy: expect.any(Array)
            });
        });

        it('should filter events by date', async () => {
            req.query.date = '2025-01-01';
            prisma.event.findMany.mockResolvedValue([]);

            await eventsController.getEvents(req, res, next);

            expect(prisma.event.findMany).toHaveBeenCalledWith({
                where: { date: new Date('2025-01-01'), status: 'published' },
                orderBy: expect.any(Array)
            });
        });

        it('should call next with error on failure', async () => {
            const error = new Error('DB Error');
            prisma.event.findMany.mockRejectedValue(error);

            await eventsController.getEvents(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getEventById', () => {
        it('should get event by id successfully (200)', async () => {
            req.params.id = 'e1';
            const mockEvent = {
                id: 'e1',
                title: 'Test Event',
                registrations: []
            };
            prisma.event.findUnique.mockResolvedValue(mockEvent);

            await eventsController.getEventById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockEvent
            });
        });

        it('should return 404 if event not found', async () => {
            req.params.id = 'e1';
            prisma.event.findUnique.mockResolvedValue(null);

            await eventsController.getEventById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Event not found'
            });
        });

        it('should call next with error on failure', async () => {
            req.params.id = 'e1';
            const error = new Error('DB Error');
            prisma.event.findUnique.mockRejectedValue(error);

            await eventsController.getEventById(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('createEvent', () => {
        it('should create event successfully (201)', async () => {
            req.body = {
                title: 'New Event',
                description: 'Description',
                category: 'seminar',
                date: '2025-02-01',
                start_time: '10:00',
                end_time: '12:00',
                location: 'Hall A',
                capacity: 100,
                registration_deadline: '2025-01-31',
                is_paid: false
            };
            const mockEvent = { id: 'e1', ...req.body };
            prisma.event.create.mockResolvedValue(mockEvent);

            await eventsController.createEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockEvent
            });
        });

        it('should create paid event with price', async () => {
            req.body = {
                title: 'Paid Event',
                date: '2025-02-01',
                registration_deadline: '2025-01-31',
                is_paid: true,
                price: 50
            };
            prisma.event.create.mockResolvedValue({ id: 'e1' });

            await eventsController.createEvent(req, res, next);

            expect(prisma.event.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    is_paid: true,
                    price: 50
                })
            });
        });

        it('should call next with error on creation failure', async () => {
            req.body = { title: 'Event' };
            const error = new Error('Creation failed');
            prisma.event.create.mockRejectedValue(error);

            await eventsController.createEvent(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('updateEvent', () => {
        it('should update event successfully (200)', async () => {
            req.params.id = 'e1';
            req.body = { title: 'Updated Event' };
            const mockEvent = { id: 'e1', title: 'Updated Event' };
            prisma.event.update.mockResolvedValue(mockEvent);

            await eventsController.updateEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockEvent
            });
        });

        it('should convert dates when updating', async () => {
            req.params.id = 'e1';
            req.body = {
                date: '2025-02-01',
                registration_deadline: '2025-01-31'
            };
            prisma.event.update.mockResolvedValue({ id: 'e1' });

            await eventsController.updateEvent(req, res, next);

            expect(prisma.event.update).toHaveBeenCalledWith({
                where: { id: 'e1' },
                data: expect.objectContaining({
                    date: expect.any(Date),
                    registration_deadline: expect.any(Date)
                })
            });
        });

        it('should call next with error on update failure', async () => {
            req.params.id = 'e1';
            req.body = { title: 'Updated' };
            const error = new Error('Update failed');
            prisma.event.update.mockRejectedValue(error);

            await eventsController.updateEvent(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('deleteEvent', () => {
        it('should delete event successfully (200)', async () => {
            req.params.id = 'e1';
            prisma.event.delete.mockResolvedValue({ id: 'e1' });

            await eventsController.deleteEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Event deleted successfully'
            });
        });

        it('should call next with error on deletion failure', async () => {
            req.params.id = 'e1';
            const error = new Error('Deletion failed');
            prisma.event.delete.mockRejectedValue(error);

            await eventsController.deleteEvent(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('registerForEvent', () => {
        const mockEvent = {
            id: 'e1',
            title: 'Test Event',
            status: 'published',
            capacity: 100,
            registered_count: 50,
            registration_deadline: new Date('2025-12-31'),
            is_paid: false,
            price: 0
        };

        it('should register for free event successfully (201)', async () => {
            req.params.id = 'e1';
            prisma.event.findUnique.mockResolvedValue(mockEvent);
            prisma.eventRegistration.findFirst.mockResolvedValue(null);
            QRCodeService.generateEventQRCode.mockReturnValue('QR123');
            
            const mockRegistration = {
                id: 'reg1',
                user: { id: 'user123', email: 'test@example.com', fullName: 'Test User' }
            };
            
            prisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    eventRegistration: {
                        create: jest.fn().mockResolvedValue(mockRegistration)
                    },
                    event: {
                        update: jest.fn().mockResolvedValue({})
                    }
                });
            });

            NotificationService.sendEventRegistrationConfirmation.mockResolvedValue();

            await eventsController.registerForEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockRegistration
            });
        });

        it('should return 404 if event not found', async () => {
            req.params.id = 'e1';
            prisma.event.findUnique.mockResolvedValue(null);

            await eventsController.registerForEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Event not found'
            });
        });

        it('should return 400 if event is not published', async () => {
            req.params.id = 'e1';
            prisma.event.findUnique.mockResolvedValue({
                ...mockEvent,
                status: 'draft'
            });

            await eventsController.registerForEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Event is not published'
            });
        });

        it('should return 400 if event is full', async () => {
            req.params.id = 'e1';
            prisma.event.findUnique.mockResolvedValue({
                ...mockEvent,
                registered_count: 100
            });

            await eventsController.registerForEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Event is full'
            });
        });

        it('should return 400 if registration deadline passed', async () => {
            req.params.id = 'e1';
            prisma.event.findUnique.mockResolvedValue({
                ...mockEvent,
                registration_deadline: new Date('2020-01-01')
            });

            await eventsController.registerForEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Registration deadline has passed'
            });
        });

        it('should return 400 if already registered', async () => {
            req.params.id = 'e1';
            prisma.event.findUnique.mockResolvedValue(mockEvent);
            prisma.eventRegistration.findFirst.mockResolvedValue({ id: 'reg1' });

            await eventsController.registerForEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Already registered for this event'
            });
        });

        it('should return 400 if insufficient balance for paid event', async () => {
            req.params.id = 'e1';
            prisma.event.findUnique.mockResolvedValue({
                ...mockEvent,
                is_paid: true,
                price: 100
            });
            prisma.eventRegistration.findFirst.mockResolvedValue(null);
            prisma.wallet.findUnique.mockResolvedValue({
                id: 'wallet1',
                balance: 50
            });

            await eventsController.registerForEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Insufficient balance'
            });
        });

        it('should call next with error on registration failure', async () => {
            req.params.id = 'e1';
            const error = new Error('Registration failed');
            prisma.event.findUnique.mockRejectedValue(error);

            await eventsController.registerForEvent(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('cancelRegistration', () => {
        const mockRegistration = {
            id: 'reg1',
            user_id: 'user123',
            event_id: 'e1',
            checked_in: false,
            event: {
                id: 'e1',
                title: 'Test Event',
                is_paid: false,
                price: 0
            }
        };

        it('should cancel registration successfully (200)', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration);
            prisma.user.findUnique.mockResolvedValue({
                id: 'user123',
                email: 'test@example.com'
            });
            
            prisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    eventRegistration: {
                        delete: jest.fn().mockResolvedValue({})
                    },
                    event: {
                        update: jest.fn().mockResolvedValue({})
                    }
                });
            });

            NotificationService.sendEmail.mockResolvedValue();

            await eventsController.cancelRegistration(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Registration cancelled successfully'
            });
        });

        it('should return 404 if registration not found', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            prisma.eventRegistration.findUnique.mockResolvedValue(null);

            await eventsController.cancelRegistration(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Registration not found'
            });
        });

        it('should return 403 if unauthorized', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            req.user.id = 'different-user';
            prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration);

            await eventsController.cancelRegistration(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Unauthorized'
            });
        });

        it('should return 400 if already checked in', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            prisma.eventRegistration.findUnique.mockResolvedValue({
                ...mockRegistration,
                checked_in: true
            });

            await eventsController.cancelRegistration(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Cannot cancel checked-in registration'
            });
        });

        it('should call next with error on cancellation failure', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            const error = new Error('Cancellation failed');
            prisma.eventRegistration.findUnique.mockRejectedValue(error);

            await eventsController.cancelRegistration(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getEventRegistrations', () => {
        it('should get event registrations successfully (200)', async () => {
            req.params.id = 'e1';
            const mockRegistrations = [
                {
                    id: 'reg1',
                    user: { id: 'user1', email: 'user1@example.com', fullName: 'User 1' }
                }
            ];
            prisma.eventRegistration.findMany.mockResolvedValue(mockRegistrations);

            await eventsController.getEventRegistrations(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockRegistrations
            });
        });

        it('should call next with error on failure', async () => {
            req.params.id = 'e1';
            const error = new Error('DB Error');
            prisma.eventRegistration.findMany.mockRejectedValue(error);

            await eventsController.getEventRegistrations(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('checkIn', () => {
        const mockRegistration = {
            id: 'reg1',
            event_id: 'e1',
            qr_code: 'QR123',
            checked_in: false,
            event: { id: 'e1', title: 'Test Event' },
            user: { id: 'user123', email: 'test@example.com', fullName: 'Test User' }
        };

        it('should check in successfully (200)', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            req.body = { qr_code: 'QR123' };
            prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration);
            prisma.eventRegistration.update.mockResolvedValue({
                ...mockRegistration,
                checked_in: true
            });

            await eventsController.checkIn(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.any(Object),
                message: 'Check-in successful'
            });
        });

        it('should return 404 if registration not found', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            req.body = { qr_code: 'QR123' };
            prisma.eventRegistration.findUnique.mockResolvedValue(null);

            await eventsController.checkIn(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Registration not found'
            });
        });

        it('should return 400 if registration does not match event', async () => {
            req.params = { eventId: 'e2', regId: 'reg1' };
            req.body = { qr_code: 'QR123' };
            prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration);

            await eventsController.checkIn(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Registration does not match event'
            });
        });

        it('should return 400 if QR code is invalid', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            req.body = { qr_code: 'WRONG_QR' };
            prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration);

            await eventsController.checkIn(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid QR code'
            });
        });

        it('should return 400 if already checked in', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            req.body = { qr_code: 'QR123' };
            prisma.eventRegistration.findUnique.mockResolvedValue({
                ...mockRegistration,
                checked_in: true
            });

            await eventsController.checkIn(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Already checked in'
            });
        });

        it('should call next with error on check-in failure', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            req.body = { qr_code: 'QR123' };
            const error = new Error('Check-in failed');
            prisma.eventRegistration.findUnique.mockRejectedValue(error);

            await eventsController.checkIn(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getWaitlist', () => {
        it('should get waitlist successfully (200)', async () => {
            req.params = { id: 'e1' };
            const mockEvent = { id: 'e1', title: 'Test Event' };
            const mockWaitlist = [
                { id: 'w1', position: 1, user: { id: 'u1', fullName: 'User 1', email: 'u1@test.com' } }
            ];

            prisma.event.findUnique.mockResolvedValue(mockEvent);
            prisma.eventWaitlist.findUnique.mockResolvedValue({ id: 'w1', position: 1 });
            prisma.eventWaitlist.findMany.mockResolvedValue(mockWaitlist);

            await eventsController.getWaitlist(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    waitlist: mockWaitlist,
                    userPosition: 1,
                    totalOnWaitlist: 1
                })
            });
        });

        it('should return 404 if event not found', async () => {
            req.params = { id: 'e1' };
            prisma.event.findUnique.mockResolvedValue(null);

            await eventsController.getWaitlist(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should handle user not on waitlist', async () => {
            req.params = { id: 'e1' };
            const mockEvent = { id: 'e1' };
            prisma.event.findUnique.mockResolvedValue(mockEvent);
            prisma.eventWaitlist.findUnique.mockResolvedValue(null);
            prisma.eventWaitlist.findMany.mockResolvedValue([]);

            await eventsController.getWaitlist(req, res, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    userPosition: null
                })
            });
        });

        it('should call next with error on failure', async () => {
            req.params = { id: 'e1' };
            const error = new Error('DB Error');
            prisma.event.findUnique.mockRejectedValue(error);

            await eventsController.getWaitlist(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('removeFromWaitlist', () => {
        it('should remove from waitlist successfully (200)', async () => {
            req.params = { id: 'e1' };
            const mockWaitlistEntry = { id: 'w1', position: 1 };

            prisma.eventWaitlist.findUnique.mockResolvedValue(mockWaitlistEntry);
            prisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    eventWaitlist: {
                        delete: jest.fn().mockResolvedValue({}),
                        updateMany: jest.fn().mockResolvedValue({ count: 0 })
                    }
                });
            });

            await eventsController.removeFromWaitlist(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Removed from waitlist'
            });
        });

        it('should return 404 if not on waitlist', async () => {
            req.params = { id: 'e1' };
            prisma.eventWaitlist.findUnique.mockResolvedValue(null);

            await eventsController.removeFromWaitlist(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should call next with error on failure', async () => {
            req.params = { id: 'e1' };
            const error = new Error('DB Error');
            prisma.eventWaitlist.findUnique.mockRejectedValue(error);

            await eventsController.removeFromWaitlist(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getMyRegistrations', () => {
        it('should get my registrations successfully (200)', async () => {
            const mockRegistrations = [
                { id: 'reg1', eventId: 'e1', event: { title: 'Event 1' } }
            ];

            prisma.eventRegistration.findMany.mockResolvedValue(mockRegistrations);

            await eventsController.getMyRegistrations(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockRegistrations
            });
        });

        it('should call next with error on failure', async () => {
            const error = new Error('DB Error');
            prisma.eventRegistration.findMany.mockRejectedValue(error);

            await eventsController.getMyRegistrations(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('registerForEvent - waitlist scenarios', () => {
        it('should add to waitlist if event is full', async () => {
            req.params.id = 'e1';
            const fullEvent = {
                ...mockEvent,
                registered_count: 100,
                capacity: 100
            };
            prisma.event.findUnique.mockResolvedValue(fullEvent);
            prisma.eventWaitlist.findUnique.mockResolvedValue(null);
            prisma.eventWaitlist.count.mockResolvedValue(5);
            prisma.eventWaitlist.create.mockResolvedValue({
                id: 'w1',
                position: 6,
                user: { id: 'user123', email: 'test@example.com', fullName: 'Test User' }
            });
            NotificationService.sendEmail.mockResolvedValue();

            await eventsController.registerForEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    waitlist: true,
                    position: 6
                })
            });
        });

        it('should return 400 if already on waitlist', async () => {
            req.params.id = 'e1';
            const fullEvent = {
                ...mockEvent,
                registered_count: 100,
                capacity: 100
            };
            prisma.event.findUnique.mockResolvedValue(fullEvent);
            prisma.eventWaitlist.findUnique.mockResolvedValue({
                id: 'w1',
                position: 3
            });

            await eventsController.registerForEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'You are already on the waitlist',
                waitlistPosition: 3
            });
        });

        it('should handle paid event with sufficient balance', async () => {
            req.params.id = 'e1';
            const paidEvent = {
                ...mockEvent,
                is_paid: true,
                price: 50
            };
            prisma.event.findUnique.mockResolvedValue(paidEvent);
            prisma.eventRegistration.findFirst.mockResolvedValue(null);
            prisma.wallet.findUnique.mockResolvedValue({
                id: 'wallet1',
                balance: 100
            });
            QRCodeService.generateEventQRCode.mockReturnValue('QR123');
            
            const mockRegistration = {
                id: 'reg1',
                user: { id: 'user123', email: 'test@example.com', fullName: 'Test User' }
            };
            
            prisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    eventRegistration: {
                        create: jest.fn().mockResolvedValue(mockRegistration)
                    },
                    event: {
                        update: jest.fn().mockResolvedValue({})
                    },
                    eventWaitlist: {
                        findFirst: jest.fn().mockResolvedValue(null)
                    },
                    user: {
                        findUnique: jest.fn().mockResolvedValue(null)
                    }
                });
            });

            PaymentService.deductFromWallet.mockResolvedValue();
            NotificationService.sendEventRegistrationConfirmation.mockResolvedValue();

            await eventsController.registerForEvent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('cancelRegistration - refund scenarios', () => {
        it('should refund for paid event', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            const paidRegistration = {
                ...mockRegistration,
                event: {
                    id: 'e1',
                    title: 'Paid Event',
                    is_paid: true,
                    price: 50
                }
            };
            prisma.eventRegistration.findUnique.mockResolvedValue(paidRegistration);
            prisma.user.findUnique.mockResolvedValue({
                id: 'user123',
                email: 'test@example.com'
            });
            
            prisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    eventRegistration: {
                        delete: jest.fn().mockResolvedValue({})
                    },
                    event: {
                        update: jest.fn().mockResolvedValue({}),
                        findUnique: jest.fn().mockResolvedValue({ id: 'e1', capacity: 100, registered_count: 50 })
                    },
                    eventWaitlist: {
                        findFirst: jest.fn().mockResolvedValue(null)
                    },
                    user: {
                        findUnique: jest.fn().mockResolvedValue(null)
                    }
                });
            });

            prisma.wallet.findUnique.mockResolvedValue({ id: 'wallet1' });
            PaymentService.refundToWallet.mockResolvedValue();
            NotificationService.sendEmail.mockResolvedValue();

            await eventsController.cancelRegistration(req, res, next);

            expect(PaymentService.refundToWallet).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should notify waitlist when space opens', async () => {
            req.params = { eventId: 'e1', regId: 'reg1' };
            prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration);
            prisma.user.findUnique.mockResolvedValue({
                id: 'user123',
                email: 'test@example.com'
            });
            
            prisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    eventRegistration: {
                        delete: jest.fn().mockResolvedValue({})
                    },
                    event: {
                        update: jest.fn().mockResolvedValue({}),
                        findUnique: jest.fn().mockResolvedValue({ id: 'e1', capacity: 100, registered_count: 99 })
                    },
                    eventWaitlist: {
                        findFirst: jest.fn().mockResolvedValue({
                            id: 'w1',
                            userId: 'waitlistUser',
                            position: 1
                        })
                    },
                    user: {
                        findUnique: jest.fn().mockResolvedValue({
                            id: 'waitlistUser',
                            email: 'waitlist@test.com'
                        })
                    }
                });
            });

            NotificationService.sendEmail.mockResolvedValue();

            await eventsController.cancelRegistration(req, res, next);

            expect(NotificationService.sendEmail).toHaveBeenCalled();
        });
    });
}); 