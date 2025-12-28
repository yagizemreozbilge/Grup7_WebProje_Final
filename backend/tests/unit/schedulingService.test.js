const SchedulingService = require('../../src/services/SchedulingService');
const prisma = require('../../src/prisma');

jest.mock('../../src/prisma', () => ({
    enrollments: { findMany: jest.fn() },
    student: { findUnique: jest.fn() },
    faculty: { findUnique: jest.fn() },
    course_sections: { findMany: jest.fn() },
    schedule: { deleteMany: jest.fn(), createMany: jest.fn() }
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
            const sections = [section];
            const constraints = { classroomCapacity: true };
            const result = SchedulingService.checkHardConstraints(section, classroom, mockTimeSlot, new Map(), new Map(), sections, constraints);
            expect(result).toBe(false);
        });

        it('should fail if classroom double booked', () => {
            const section = { id: 's2', capacity: 20 };
            const classroom = { id: 'c1', capacity: 50 };
            const sections = [section];
            const assignments = new Map([
                ['s1', { classroom_id: 'c1', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00' }]
            ]);
            const constraints = { noClassroomDoubleBooking: true };
            const result = SchedulingService.checkHardConstraints(section, classroom, mockTimeSlot, assignments, new Map(), sections, constraints);
            expect(result).toBe(false);
        });

        it('should fail if student has conflict', () => {
            const section = { id: 's2', capacity: 20 };
            const classroom = { id: 'c2', capacity: 50 };
            const sections = [{ id: 's1' }, section];
            const studentSections = new Map([
                ['stu1', ['s1', 's2']]
            ]);
            const assignments = new Map([
                ['s1', { classroom_id: 'c1', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00' }]
            ]);
            const constraints = { noStudentScheduleConflict: true };
            const result = SchedulingService.checkHardConstraints(section, classroom, mockTimeSlot, assignments, studentSections, sections, constraints);
            expect(result).toBe(false);
        });

        it('should fail if instructor double booked', () => {
            const section = { id: 's2', capacity: 20, instructor_id: 'i1' };
            const classroom = { id: 'c2', capacity: 50 };
            const sections = [
                { id: 's1', instructor_id: 'i1' },
                section
            ];
            const assignments = new Map([
                ['s1', { classroom_id: 'c1', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00' }]
            ]);
            const constraints = { noInstructorDoubleBooking: true };
            const result = SchedulingService.checkHardConstraints(section, classroom, mockTimeSlot, assignments, new Map(), sections, constraints);
            expect(result).toBe(false);
        });

        it('should fail if classroom features do not match', () => {
            const section = { id: 's1', capacity: 20, course: { requirements: { features: ['projector', 'whiteboard'] } } };
            const classroom = { id: 'c1', capacity: 30, features_json: { projector: true } };
            const sections = [section];
            const constraints = { classroomFeatures: true };
            const result = SchedulingService.checkHardConstraints(section, classroom, mockTimeSlot, new Map(), new Map(), sections, constraints);
            expect(result).toBe(false);
        });

        it('should pass if classroom features match', () => {
            const section = { id: 's1', capacity: 20, course: { requirements: { features: ['projector'] } } };
            const classroom = { id: 'c1', capacity: 30, features_json: { projector: true } };
            const sections = [section];
            const constraints = { classroomFeatures: true };
            const result = SchedulingService.checkHardConstraints(section, classroom, mockTimeSlot, new Map(), new Map(), sections, constraints);
            expect(result).toBe(true);
        });

        it('should pass if no constraints enabled', () => {
            const section = { id: 's1', capacity: 20 };
            const classroom = { id: 'c1', capacity: 30 };
            const sections = [section];
            const constraints = {};
            const result = SchedulingService.checkHardConstraints(section, classroom, mockTimeSlot, new Map(), new Map(), sections, constraints);
            expect(result).toBe(true);
        });

        it('should pass if classroom capacity matches', () => {
            const section = { id: 's1', capacity: 20 };
            const classroom = { id: 'c1', capacity: 20 };
            const sections = [section];
            const constraints = { classroomCapacity: true };
            const result = SchedulingService.checkHardConstraints(section, classroom, mockTimeSlot, new Map(), new Map(), sections, constraints);
            expect(result).toBe(true);
        });
    });

    describe('generateSchedule', () => {
        it('should generate a valid schedule for simple case', async () => {
            prisma.enrollments.findMany.mockResolvedValue([]);
            const sections = [{ id: 's1', capacity: 20, course_id: 'c1' }];
            const classrooms = [{ id: 'c1', capacity: 30 }];
            const timeSlots = [{ day: 'Monday', start: '09:00', end: '10:00' }];

            const schedule = await SchedulingService.generateSchedule(sections, classrooms, timeSlots);
            expect(schedule).toHaveLength(1);
            expect(schedule[0].section_id).toBe('s1');
        });

        it('should throw error if no valid schedule found', async () => {
            prisma.enrollments.findMany.mockResolvedValue([]);
            const sections = [{ id: 's1', capacity: 100, course_id: 'c1' }];
            const classrooms = [{ id: 'c1', capacity: 30 }]; // Too small
            const timeSlots = [{ day: 'Monday', start: '09:00', end: '10:00' }];

            await expect(SchedulingService.generateSchedule(sections, classrooms, timeSlots))
                .rejects.toThrow('Could not generate valid schedule');
        });

        it('should handle enrollments grouping by student', async () => {
            prisma.enrollments.findMany.mockResolvedValue([
                { student_id: 'stu1', section_id: 's1' },
                { student_id: 'stu1', section_id: 's2' },
                { student_id: 'stu2', section_id: 's1' }
            ]);
            const sections = [
                { id: 's1', capacity: 20, course_id: 'c1' },
                { id: 's2', capacity: 20, course_id: 'c2' }
            ];
            const classrooms = [{ id: 'c1', capacity: 30 }, { id: 'c2', capacity: 30 }];
            const timeSlots = [
                { day: 'Monday', start: '09:00', end: '10:00' },
                { day: 'Monday', start: '10:00', end: '11:00' }
            ];

            const schedule = await SchedulingService.generateSchedule(sections, classrooms, timeSlots);
            expect(schedule.length).toBeGreaterThanOrEqual(1);
        });

        it('should handle backtracking when assignment fails', async () => {
            prisma.enrollments.findMany.mockResolvedValue([]);
            const sections = [
                { id: 's1', capacity: 20, course_id: 'c1', instructor_id: 'i1' },
                { id: 's2', capacity: 20, course_id: 'c2', instructor_id: 'i1' }
            ];
            const classrooms = [{ id: 'c1', capacity: 30 }];
            const timeSlots = [{ day: 'Monday', start: '09:00', end: '10:00' }];

            await expect(SchedulingService.generateSchedule(sections, classrooms, timeSlots))
                .rejects.toThrow('Could not generate valid schedule');
        });
    });

    describe('User Schedule & iCal', () => {
        it('should get user schedule for student', async () => {
            prisma.student.findUnique.mockResolvedValue({
                enrollments: [
                    { 
                        section: { 
                            id: 'sec1', 
                            schedules: [{ 
                                day_of_week: 'Monday', 
                                start_time: '09:00', 
                                end_time: '10:00', 
                                classroom: { name: 'Room 1' } 
                            }], 
                            courses: { code: 'C1', name: 'Course 1' } 
                        } 
                    }
                ]
            });
            const schedule = await SchedulingService.getUserSchedule('user1', 'student');
            expect(schedule).toBeDefined();
            expect(schedule.monday).toBeDefined();
        });

        it('should get user schedule for faculty', async () => {
            prisma.faculty.findUnique.mockResolvedValue({
                user: { id: 'user1' }
            });
            prisma.course_sections.findMany.mockResolvedValue([
                {
                    id: 'sec1',
                    schedules: [{ 
                        day_of_week: 'Monday', 
                        start_time: '09:00', 
                        end_time: '10:00', 
                        classroom: { name: 'Room 1' } 
                    }],
                    courses: { code: 'C1', name: 'Course 1' }
                }
            ]);
            const schedule = await SchedulingService.getUserSchedule('user1', 'faculty');
            expect(schedule).toBeDefined();
        });

        it('should return empty schedule if student not found', async () => {
            prisma.student.findUnique.mockResolvedValue(null);
            const schedule = await SchedulingService.getUserSchedule('user1', 'student');
            expect(schedule).toBeDefined();
        });

        it('should generate iCal content', () => {
            const weeklySchedule = { 
                monday: [{ 
                    start_time: '09:00', 
                    end_time: '10:00', 
                    course_code: 'C1', 
                    course_name: 'Course 1', 
                    section_id: 'sec1',
                    section_number: '1',
                    classroom: {
                        building: 'Building A',
                        room_number: '101'
                    }
                }],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: []
            };
            const ical = SchedulingService.generateICal(weeklySchedule, new Date('2025-01-01'), new Date('2025-12-31'));
            expect(ical).toContain('BEGIN:VCALENDAR');
            expect(ical).toContain('SUMMARY:C1 - Course 1');
        });
    });

    describe('saveSchedule', () => {
        it('should save schedule to database', async () => {
            prisma.schedule.deleteMany.mockResolvedValue({ count: 0 });
            prisma.schedule.createMany.mockResolvedValue({ count: 1 });
            const scheduleEntries = [
                { section_id: 's1', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', classroom_id: 'c1' }
            ];
            const result = await SchedulingService.saveSchedule('schedule1', scheduleEntries);
            expect(prisma.schedule.deleteMany).toHaveBeenCalled();
            expect(prisma.schedule.createMany).toHaveBeenCalled();
        });
    });

    describe('optimizeSchedule', () => {
        it('should return schedule as-is (stub implementation)', () => {
            const schedule = [
                { section_id: 's1', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00' }
            ];
            const optimized = SchedulingService.optimizeSchedule(schedule, [], [], [], {}, {});
            expect(optimized).toEqual(schedule);
        });
    });
});

