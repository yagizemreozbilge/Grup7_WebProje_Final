const SchedulingService = require('../../src/services/SchedulingService');
const prisma = require('../../src/prisma');

jest.mock('../../src/prisma', () => ({
    enrollments: { findMany: jest.fn() }
}));

describe('SchedulingService Unit Tests', () => {
    describe('timeOverlaps', () => {
        it('should detect direct overlap', () => {
            expect(SchedulingService.timeOverlaps('09:00', '11:00', '10:00', '12:00')).toBe(true);
        });
        it('should detect inclusion overlap', () => {
            expect(SchedulingService.timeOverlaps('09:00', '12:00', '10:00', '11:00')).toBe(true);
        });
        it('should not detect non-overlapping intervals (before)', () => {
            expect(SchedulingService.timeOverlaps('09:00', '10:00', '10:00', '11:00')).toBe(false);
        });
    });

    describe('checkHardConstraints', () => {
        const mockTimeSlot = { day: 'Monday', start: '09:00', end: '10:00' };

        it('should fail if classroom capacity is insufficient', () => {
            const section = { id: 's1', capacity: 50 };
            const classroom = { id: 'c1', capacity: 30 };
            const constraints = { classroomCapacity: true };
            const result = SchedulingService.checkHardConstraints(section, classroom, mockTimeSlot, new Map(), new Map(), constraints);
            expect(result).toBe(false);
        });

        it('should fail if classroom double booked', () => {
            const section = { id: 's2', capacity: 20 };
            const classroom = { id: 'c1', capacity: 50 };
            const assignments = new Map([
                ['s1', { classroom_id: 'c1', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00' }]
            ]);
            const constraints = { noClassroomDoubleBooking: true };
            const result = SchedulingService.checkHardConstraints(section, classroom, mockTimeSlot, assignments, new Map(), constraints);
            expect(result).toBe(false);
        });

        it('should fail if student has conflict', () => {
            const section = { id: 's2', capacity: 20 };
            const classroom = { id: 'c2', capacity: 50 };
            const studentSections = new Map([
                ['stu1', ['s1', 's2']]
            ]);
            const assignments = new Map([
                ['s1', { classroom_id: 'c1', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00' }]
            ]);
            const constraints = { noStudentScheduleConflict: true };
            const result = SchedulingService.checkHardConstraints(section, classroom, mockTimeSlot, assignments, studentSections, constraints);
            expect(result).toBe(false);
        });
    });

    describe('generateSchedule', () => {
        it('should generate a valid schedule for simple case', async () => {
            prisma.enrollments.findMany.mockResolvedValue([]);
            const sections = [{ id: 's1', capacity: 20 }];
            const classrooms = [{ id: 'c1', capacity: 30 }];
            const timeSlots = [{ day: 'Monday', start: '09:00', end: '10:00' }];

            const schedule = await SchedulingService.generateSchedule(sections, classrooms, timeSlots);
            expect(schedule).toHaveLength(1);
            expect(schedule[0].section_id).toBe('s1');
        });

        it('should throw error if no valid schedule found', async () => {
            prisma.enrollments.findMany.mockResolvedValue([]);
            const sections = [{ id: 's1', capacity: 100 }];
            const classrooms = [{ id: 'c1', capacity: 30 }]; // Too small
            const timeSlots = [{ day: 'Monday', start: '09:00', end: '10:00' }];

            await expect(SchedulingService.generateSchedule(sections, classrooms, timeSlots))
                .rejects.toThrow('Could not generate valid schedule');
        });
    });

    describe('User Schedule & iCal', () => {
        it('should get user schedule', async () => {
            prisma.enrollments.findMany.mockResolvedValue([
                { section: { id: 'sec1', schedule: [{ day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', classroom: { name: 'Room 1' } }], courses: { code: 'C1', name: 'Course 1' } } }
            ]);
            const schedule = await SchedulingService.getUserSchedule('user1', 'student');
            expect(schedule.Monday).toHaveLength(1);
        });

        it('should generate iCal content', () => {
            const weeklySchedule = { Monday: [{ startTime: '09:00', endTime: '10:00', courseCode: 'C1', courseName: 'Course 1', location: 'Room 1' }] };
            const ical = SchedulingService.generateICal(weeklySchedule, new Date(), new Date());
            expect(ical).toContain('BEGIN:VCALENDAR');
            expect(ical).toContain('SUMMARY:C1 - Course 1');
        });
    });
});

