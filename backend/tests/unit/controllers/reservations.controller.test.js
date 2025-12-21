jest.mock('../../../src/services/NotificationService');
jest.mock('../../../src/prisma', () => ({
    classroomReservation: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
    },
    user: {
        findMany: jest.fn(),
        findUnique: jest.fn()
    }
}));

const reservationsController = require('../../../src/controllers/reservationsController');

describe('Reservations Controller Unit Tests', () => {
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

    describe('createReservation', () => {
        it('should create reservation for faculty without approval (201)', async () => {
            req.user.role = 'faculty';
            req.body = {
                classroom_id: 'cr1',
                date: '2025-01-01',
                start_time: '10:00',
                end_time: '12:00',
                purpose: 'Lecture'
            };
            prisma.classroomReservation.findMany.mockResolvedValue([]);
            prisma.user.findUnique.mockResolvedValue({ id: 'user123', role: 'faculty' });
            const mockReservation = {
                id: 'res1',
                status: 'approved',
                classroom: {},
                user: { id: 'user123', email: 'test@example.com', fullName: 'Test User' }
            };
            prisma.classroomReservation.create.mockResolvedValue(mockReservation);

            await reservationsController.createReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockReservation });
        });

        it('should create reservation for student with pending status (201)', async () => {
            req.body = {
                classroom_id: 'cr1',
                date: '2025-01-01',
                start_time: '10:00',
                end_time: '12:00',
                purpose: 'Study'
            };
            prisma.classroomReservation.findMany.mockResolvedValue([]);
            prisma.user.findUnique.mockResolvedValue({ id: 'user123', role: 'student', fullName: 'Test Student', email: 'student@test.com' });
            prisma.user.findMany.mockResolvedValue([{ email: 'admin@test.com' }]);
            const mockReservation = {
                id: 'res1',
                status: 'pending',
                classroom: {},
                user: { id: 'user123', email: 'student@test.com', fullName: 'Test Student' }
            };
            prisma.classroomReservation.create.mockResolvedValue(mockReservation);
            NotificationService.sendEmail.mockResolvedValue();

            await reservationsController.createReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(NotificationService.sendEmail).toHaveBeenCalled();
        });

        it('should return 400 if classroom has time overlap', async () => {
            req.body = {
                classroom_id: 'cr1',
                date: '2025-01-01',
                start_time: '10:00',
                end_time: '12:00',
                purpose: 'Lecture'
            };
            prisma.classroomReservation.findMany.mockResolvedValue([
                {
                    id: 'existing',
                    start_time: '11:00',
                    end_time: '13:00',
                    status: 'approved'
                }
            ]);

            await reservationsController.createReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Classroom is not available at this time'
            });
        });

        it('should call next with error on creation failure', async () => {
            req.body = { classroom_id: 'cr1' };
            const error = new Error('Creation failed');
            prisma.classroomReservation.findMany.mockRejectedValue(error);

            await reservationsController.createReservation(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getReservations', () => {
        it('should get all reservations for admin (200)', async () => {
            req.user.role = 'admin';
            const mockReservations = [
                { id: 'res1', classroom: {}, user: { id: 'u1', email: 'test@test.com', fullName: 'Test' } }
            ];
            prisma.classroomReservation.findMany.mockResolvedValue(mockReservations);

            await reservationsController.getReservations(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockReservations });
        });

        it('should get only own reservations for student (200)', async () => {
            const mockReservations = [{ id: 'res1', user_id: 'user123', classroom: {}, user: {} }];
            prisma.classroomReservation.findMany.mockResolvedValue(mockReservations);

            await reservationsController.getReservations(req, res, next);

            expect(prisma.classroomReservation.findMany).toHaveBeenCalledWith({
                where: { user_id: 'user123' },
                include: expect.any(Object),
                orderBy: expect.any(Array)
            });
        });

        it('should filter reservations by date, classroom_id, and status', async () => {
            req.query = { date: '2025-01-01', classroom_id: 'cr1', status: 'pending' };
            prisma.classroomReservation.findMany.mockResolvedValue([]);

            await reservationsController.getReservations(req, res, next);

            expect(prisma.classroomReservation.findMany).toHaveBeenCalledWith({
                where: {
                    user_id: 'user123',
                    date: new Date('2025-01-01'),
                    classroom_id: 'cr1',
                    status: 'pending'
                },
                include: expect.any(Object),
                orderBy: expect.any(Array)
            });
        });

        it('should call next with error on failure', async () => {
            const error = new Error('DB Error');
            prisma.classroomReservation.findMany.mockRejectedValue(error);

            await reservationsController.getReservations(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('approveReservation', () => {
        const mockReservation = {
            id: 'res1',
            status: 'pending',
            user: { email: 'student@test.com' }
        };

        it('should approve reservation successfully (200)', async () => {
            req.params.id = 'res1';
            req.user.role = 'admin';
            prisma.classroomReservation.findUnique.mockResolvedValue(mockReservation);
            const updatedReservation = {
                ...mockReservation,
                status: 'approved',
                classroom: {},
                user: { id: 'u1', email: 'student@test.com', fullName: 'Student' }
            };
            prisma.classroomReservation.update.mockResolvedValue(updatedReservation);
            NotificationService.sendEmail.mockResolvedValue();

            await reservationsController.approveReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedReservation });
            expect(NotificationService.sendEmail).toHaveBeenCalled();
        });

        it('should return 404 if reservation not found', async () => {
            req.params.id = 'res1';
            prisma.classroomReservation.findUnique.mockResolvedValue(null);

            await reservationsController.approveReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Reservation not found' });
        });

        it('should return 400 if reservation is not pending', async () => {
            req.params.id = 'res1';
            prisma.classroomReservation.findUnique.mockResolvedValue({
                ...mockReservation,
                status: 'approved'
            });

            await reservationsController.approveReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Reservation is not pending'
            });
        });

        it('should call next with error on approval failure', async () => {
            req.params.id = 'res1';
            const error = new Error('Approval failed');
            prisma.classroomReservation.findUnique.mockRejectedValue(error);

            await reservationsController.approveReservation(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('rejectReservation', () => {
        const mockReservation = {
            id: 'res1',
            status: 'pending',
            user: { email: 'student@test.com' }
        };

        it('should reject reservation successfully (200)', async () => {
            req.params.id = 'res1';
            req.body = { reason: 'Not available' };
            req.user.role = 'admin';
            prisma.classroomReservation.findUnique.mockResolvedValue(mockReservation);
            const updatedReservation = { ...mockReservation, status: 'rejected' };
            prisma.classroomReservation.update.mockResolvedValue(updatedReservation);
            NotificationService.sendEmail.mockResolvedValue();

            await reservationsController.rejectReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedReservation });
            expect(NotificationService.sendEmail).toHaveBeenCalledWith(
                'student@test.com',
                expect.any(String),
                expect.stringContaining('Not available')
            );
        });

        it('should reject without reason', async () => {
            req.params.id = 'res1';
            req.body = {};
            prisma.classroomReservation.findUnique.mockResolvedValue(mockReservation);
            prisma.classroomReservation.update.mockResolvedValue({ ...mockReservation, status: 'rejected' });
            NotificationService.sendEmail.mockResolvedValue();

            await reservationsController.rejectReservation(req, res, next);

            expect(NotificationService.sendEmail).toHaveBeenCalled();
        });

        it('should return 404 if reservation not found', async () => {
            req.params.id = 'res1';
            req.body = {};
            prisma.classroomReservation.findUnique.mockResolvedValue(null);

            await reservationsController.rejectReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Reservation not found' });
        });

        it('should return 400 if reservation is not pending', async () => {
            req.params.id = 'res1';
            req.body = {};
            prisma.classroomReservation.findUnique.mockResolvedValue({
                ...mockReservation,
                status: 'approved'
            });

            await reservationsController.rejectReservation(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Reservation is not pending'
            });
        });

        it('should call next with error on rejection failure', async () => {
            req.params.id = 'res1';
            req.body = {};
            const error = new Error('Rejection failed');
            prisma.classroomReservation.findUnique.mockRejectedValue(error);

            await reservationsController.rejectReservation(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('timeOverlaps', () => {
        it('should detect overlap correctly', () => {
            const overlaps = reservationsController.timeOverlaps('10:00', '12:00', '11:00', '13:00');
            expect(overlaps).toBe(true);
        });

        it('should not detect overlap for adjacent times', () => {
            const overlaps = reservationsController.timeOverlaps('10:00', '12:00', '12:00', '14:00');
            expect(overlaps).toBe(false);
        });

        it('should detect complete overlap', () => {
            const overlaps = reservationsController.timeOverlaps('10:00', '14:00', '11:00', '13:00');
            expect(overlaps).toBe(true);
        });

        it('should not detect overlap for separate times', () => {
            const overlaps = reservationsController.timeOverlaps('10:00', '12:00', '14:00', '16:00');
            expect(overlaps).toBe(false);
        });
    });
});