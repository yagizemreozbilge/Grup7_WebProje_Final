const enrollmentService = require('../../src/services/enrollmentService');
const prisma = require('../../src/prisma');
const { checkPrerequisites } = require('../../src/services/prerequisiteService');
const { hasScheduleConflict } = require('../../src/services/scheduleConflictService');

jest.mock('../../src/prisma', () => ({
    course_sections: { findUnique: jest.fn(), updateMany: jest.fn() },
    enrollments: { findMany: jest.fn(), create: jest.fn() }
}));

jest.mock('../../src/services/prerequisiteService', () => ({
    checkPrerequisites: jest.fn()
}));

jest.mock('../../src/services/scheduleConflictService', () => ({
    hasScheduleConflict: jest.fn()
}));

describe('enrollmentService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('enrollStudent should throw if section not found', async () => {
        prisma.course_sections.findUnique.mockResolvedValue(null);
        await expect(enrollmentService.enrollStudent({ studentId: 'stu1', sectionId: 'sec1' }))
            .rejects.toThrow('Section not found');
    });

    test('enrollStudent should check prerequisites', async () => {
        prisma.course_sections.findUnique.mockResolvedValue({ id: 'sec1', course_id: 'c1' });
        checkPrerequisites.mockRejectedValue(new Error('Prerequisite not met'));

        await expect(enrollmentService.enrollStudent({ studentId: 'stu1', sectionId: 'sec1' }))
            .rejects.toThrow('Prerequisite not met');
    });

    test('enrollStudent should check for schedule conflicts', async () => {
        prisma.course_sections.findUnique.mockResolvedValue({ id: 'sec1', course_id: 'c1', schedule_json: { time: '10:00' } });
        checkPrerequisites.mockResolvedValue(true);
        prisma.enrollments.findMany.mockResolvedValue([{ section: { schedule_json: { time: '9:00' } } }]);
        hasScheduleConflict.mockReturnValue(true);

        await expect(enrollmentService.enrollStudent({ studentId: 'stu1', sectionId: 'sec1' }))
            .rejects.toThrow('Schedule conflict');
    });

    test('enrollStudent should throw if section is full', async () => {
        prisma.course_sections.findUnique.mockResolvedValue({ id: 'sec1', course_id: 'c1', capacity: 30 });
        checkPrerequisites.mockResolvedValue(true);
        prisma.enrollments.findMany.mockResolvedValue([]);
        hasScheduleConflict.mockReturnValue(false);
        prisma.course_sections.updateMany.mockResolvedValue({ count: 0 });

        await expect(enrollmentService.enrollStudent({ studentId: 'stu1', sectionId: 'sec1' }))
            .rejects.toThrow('Section is full');
    });

    test('enrollStudent should enroll successfully', async () => {
        prisma.course_sections.findUnique.mockResolvedValue({ id: 'sec1', course_id: 'c1', capacity: 30 });
        checkPrerequisites.mockResolvedValue(true);
        prisma.enrollments.findMany.mockResolvedValue([]);
        hasScheduleConflict.mockReturnValue(false);
        prisma.course_sections.updateMany.mockResolvedValue({ count: 1 });
        prisma.enrollments.create.mockResolvedValue({ id: 'enr1' });

        const result = await enrollmentService.enrollStudent({ studentId: 'stu1', sectionId: 'sec1' });
        expect(result.id).toBe('enr1');
    });
});
