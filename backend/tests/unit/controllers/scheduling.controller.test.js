jest.mock('../../../src/services/SchedulingService');
jest.mock('../../../src/prisma', () => ({
    course_sections: {
        findMany: jest.fn()
    },
    classrooms: {
        findMany: jest.fn()
    },
    schedule: {
        findMany: jest.fn()
    }
}));

const schedulingController = require('../../../src/controllers/schedulingController');
const SchedulingService = require('../../../src/services/SchedulingService');

describe('Scheduling Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { id: 'admin123', role: 'admin' },
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('generateSchedule', () => {
        it('should generate schedule successfully with section and classroom IDs (200)', async () => {
            req.body = {
                sections: ['s1', 's2'],
                classrooms: ['cr1', 'cr2']
            };
            const mockSections = [
                { id: 's1', courses: { code: 'CS101', name: 'Intro' } }
            ];
            const mockClassrooms = [
                { id: 'cr1', name: 'Room 101' }
            ];
            const mockSchedule = [
                { id: 'sch1', section_id: 's1', classroom_id: 'cr1', day: 'monday', start_time: '09:00' }
            ];

            prisma.course_sections.findMany.mockResolvedValue(mockSections);
            prisma.classrooms.findMany.mockResolvedValue(mockClassrooms);
            SchedulingService.generateSchedule.mockResolvedValue(mockSchedule);
            SchedulingService.saveSchedule.mockResolvedValue();

            await schedulingController.generateSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockSchedule,
                message: 'Schedule generated successfully'
            });
        });

        it('should generate schedule with provided data objects (200)', async () => {
            const mockSections = [{ id: 's1', name: 'Section 1' }];
            const mockClassrooms = [{ id: 'cr1', name: 'Room 101' }];
            
            req.body = {
                sections: mockSections,
                classrooms: mockClassrooms
            };
            
            const mockSchedule = [{ id: 'sch1' }];
            SchedulingService.generateSchedule.mockResolvedValue(mockSchedule);
            SchedulingService.saveSchedule.mockResolvedValue();

            await schedulingController.generateSchedule(req, res, next);

            expect(prisma.course_sections.findMany).not.toHaveBeenCalled();
            expect(prisma.classrooms.findMany).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should use default time slots if not provided', async () => {
            req.body = {
                sections: [{ id: 's1' }],
                classrooms: [{ id: 'cr1' }]
            };
            
            SchedulingService.generateSchedule.mockResolvedValue([]);
            SchedulingService.saveSchedule.mockResolvedValue();

            await schedulingController.generateSchedule(req, res, next);

            expect(SchedulingService.generateSchedule).toHaveBeenCalledWith(
                expect.any(Array),
                expect.any(Array),
                expect.arrayContaining([
                    expect.objectContaining({ day: 'monday', start: '09:00' })
                ]),
                {}
            );
        });

        it('should use provided time slots and instructor preferences', async () => {
            const customTimeSlots = [
                { day: 'monday', start: '08:00', end: '09:30' }
            ];
            const instructorPrefs = { instructor1: ['monday'] };
            
            req.body = {
                sections: [{ id: 's1' }],
                classrooms: [{ id: 'cr1' }],
                timeSlots: customTimeSlots,
                instructorPreferences: instructorPrefs
            };
            
            SchedulingService.generateSchedule.mockResolvedValue([]);
            SchedulingService.saveSchedule.mockResolvedValue();

            await schedulingController.generateSchedule(req, res, next);

            expect(SchedulingService.generateSchedule).toHaveBeenCalledWith(
                expect.any(Array),
                expect.any(Array),
                customTimeSlots,
                instructorPrefs
            );
        });

        it('should call next with error on generation failure', async () => {
            req.body = { sections: [], classrooms: [] };
            const error = new Error('Generation failed');
            SchedulingService.generateSchedule.mockRejectedValue(error);

            await schedulingController.generateSchedule(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getSchedule', () => {
        it('should get all schedules successfully (200)', async () => {
            req.params.scheduleId = 'sch1';
            const mockSchedules = [
                {
                    id: 'sch1',
                    section: { courses: { code: 'CS101' } },
                    classroom: { name: 'Room 101' }
                }
            ];
            prisma.schedule.findMany.mockResolvedValue(mockSchedules);

            await schedulingController.getSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockSchedules });
        });

        it('should call next with error on failure', async () => {
            req.params.scheduleId = 'sch1';
            const error = new Error('DB Error');
            prisma.schedule.findMany.mockRejectedValue(error);

            await schedulingController.getSchedule(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getMySchedule', () => {
        it('should get user schedule successfully (200)', async () => {
            const mockWeeklySchedule = {
                monday: [{ time: '09:00', course: 'CS101' }],
                tuesday: []
            };
            SchedulingService.getUserSchedule.mockResolvedValue(mockWeeklySchedule);

            await schedulingController.getMySchedule(req, res, next);

            expect(SchedulingService.getUserSchedule).toHaveBeenCalledWith('admin123', 'admin');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockWeeklySchedule });
        });

        it('should call next with error on failure', async () => {
            const error = new Error('Schedule fetch failed');
            SchedulingService.getUserSchedule.mockRejectedValue(error);

            await schedulingController.getMySchedule(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getMyScheduleICal', () => {
        it('should generate and send iCal file (200)', async () => {
            req.query = {
                startDate: '2025-01-01',
                endDate: '2025-05-01'
            };
            
            const mockWeeklySchedule = {
                monday: [{ time: '09:00', course: 'CS101' }]
            };
            const mockICal = 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR';
            
            SchedulingService.getUserSchedule.mockResolvedValue(mockWeeklySchedule);
            SchedulingService.generateICal.mockReturnValue(mockICal);

            await schedulingController.getMyScheduleICal(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/calendar');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="schedule.ics"');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockICal);
        });

        it('should use default date range if not provided', async () => {
            req.query = {};
            
            SchedulingService.getUserSchedule.mockResolvedValue({});
            SchedulingService.generateICal.mockReturnValue('ICAL');

            await schedulingController.getMyScheduleICal(req, res, next);

            expect(SchedulingService.generateICal).toHaveBeenCalledWith(
                {},
                expect.any(Date),
                expect.any(Date)
            );
        });

        it('should call next with error on failure', async () => {
            req.query = {};
            const error = new Error('iCal generation failed');
            SchedulingService.getUserSchedule.mockRejectedValue(error);

            await schedulingController.getMyScheduleICal(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});