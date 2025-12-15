jest.mock('../../src/prisma', () => ({
  course_prerequisites: {
    findMany: jest.fn()
  },
  enrollments: {
    findFirst: jest.fn()
  }
}));

const prisma = require('../../src/prisma');
const { checkPrerequisites } = require('../../src/services/prerequisiteService');

describe('PrerequisiteService - unit tests', () => {

  afterEach(() => jest.clearAllMocks());

  test('passes when course has no prerequisites', async () => {
    prisma.course_prerequisites.findMany.mockResolvedValue([]);

    await expect(
      checkPrerequisites(1, 100)
    ).resolves.not.toThrow();

    expect(prisma.enrollments.findFirst).not.toHaveBeenCalled();
  });

  test('passes recursive prerequisite chain', async () => {
    prisma.course_prerequisites.findMany
      .mockResolvedValueOnce([{ prerequisite_course_id: 2 }])
      .mockResolvedValueOnce([]);

    prisma.enrollments.findFirst.mockResolvedValue({
      status: 'completed',
      letter_grade: 'A'
    });

    await expect(
      checkPrerequisites(1, 100)
    ).resolves.not.toThrow();

    expect(prisma.course_prerequisites.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.enrollments.findFirst).toHaveBeenCalledTimes(1);
  });

  test('throws error if prerequisite is not completed', async () => {
    prisma.course_prerequisites.findMany.mockResolvedValue([
      { prerequisite_course_id: 5 }
    ]);
    prisma.enrollments.findFirst.mockResolvedValue(null);

    await expect(
      checkPrerequisites(3, 200)
    ).rejects.toThrow('Prerequisite not met');
  });
});

