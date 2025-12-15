jest.mock('../../src/prisma');
jest.mock('../../src/services/prerequisiteService');
jest.mock('../../src/services/scheduleConflictService');

const prisma = require('../../src/prisma');
const { checkPrerequisites } = require('../../src/services/prerequisiteService');
const { hasScheduleConflict } = require('../../src/services/scheduleConflictService');
const { enrollStudent } = require('../../src/services/enrollmentService');

describe('EnrollmentService - integration tests', () => {

  afterEach(() => jest.clearAllMocks());

  test('throws error if section not found', async () => {
    prisma.course_sections.findUnique.mockResolvedValue(null);

    await expect(
      enrollStudent({ studentId: 1, sectionId: 10 })
    ).rejects.toThrow('Section not found');
  });

  test('throws error on schedule conflict', async () => {
    prisma.course_sections.findUnique.mockResolvedValue({
      id: 10,
      capacity: 30,
      enrolled_count: 10,
      schedule_json: { day: 'Mon' },
      course_id: 5
    });

    checkPrerequisites.mockResolvedValue();
    prisma.enrollments.findMany.mockResolvedValue([
      { section: { schedule_json: { day: 'Mon' } } }
    ]);
    hasScheduleConflict.mockReturnValue(true);

    await expect(
      enrollStudent({ studentId: 1, sectionId: 10 })
    ).rejects.toThrow('Schedule conflict');
  });

  test('throws error if section is full', async () => {
    prisma.course_sections.findUnique.mockResolvedValue({
      id: 10,
      capacity: 1,
      enrolled_count: 1,
      schedule_json: null,
      course_id: 5
    });

    checkPrerequisites.mockResolvedValue();
    prisma.enrollments.findMany.mockResolvedValue([]);
    hasScheduleConflict.mockReturnValue(false);
    prisma.course_sections.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      enrollStudent({ studentId: 1, sectionId: 10 })
    ).rejects.toThrow('Section is full');
  });

  test('enrolls student successfully', async () => {
    prisma.course_sections.findUnique.mockResolvedValue({
      id: 10,
      capacity: 30,
      enrolled_count: 10,
      schedule_json: null,
      course_id: 5
    });

    checkPrerequisites.mockResolvedValue();
    prisma.enrollments.findMany.mockResolvedValue([]);
    hasScheduleConflict.mockReturnValue(false);
    prisma.course_sections.updateMany.mockResolvedValue({ count: 1 });
    prisma.enrollments.create.mockResolvedValue({ id: 99 });

    const result = await enrollStudent({ studentId: 1, sectionId: 10 });

    expect(result.id).toBe(99);
  });
});
