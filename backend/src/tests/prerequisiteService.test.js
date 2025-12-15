const { checkPrerequisites } = require('../services/prerequisiteService');
const prisma = require('../prisma');

describe('PrerequisiteService', () => {
  it('should throw error if prerequisite not met', async () => {
    await expect(checkPrerequisites('courseId1', 'studentId1')).rejects.toThrow('Prerequisite not met');
  });
  it('should pass if all prerequisites are met', async () => {
    prisma.enrollments.findFirst = jest.fn().mockResolvedValue({});
    prisma.course_prerequisites.findMany = jest.fn().mockResolvedValue([]);
    await expect(checkPrerequisites('courseId2', 'studentId2')).resolves.toBeUndefined();
  });
});
