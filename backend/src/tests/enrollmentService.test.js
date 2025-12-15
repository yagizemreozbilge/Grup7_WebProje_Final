const { enrollStudent } = require('../services/enrollmentService');
const prisma = require('../prisma');

describe('EnrollmentService', () => {
  it('should throw if section is full', async () => {
    prisma.course_sections.findUnique = jest.fn().mockResolvedValue({
      id: 'section1', course_id: 'course1', capacity: 1, enrolled_count: 1, schedule_json: null
    });
    prisma.enrollments.findMany = jest.fn().mockResolvedValue([]);
    prisma.course_sections.updateMany = jest.fn().mockResolvedValue({ count: 0 });
    await expect(enrollStudent({ studentId: 'student1', sectionId: 'section1' })).rejects.toThrow('Section is full');
  });
  it('should enroll if all checks pass', async () => {
    prisma.course_sections.findUnique = jest.fn().mockResolvedValue({
      id: 'section2', course_id: 'course2', capacity: 2, enrolled_count: 1, schedule_json: null
    });
    prisma.enrollments.findMany = jest.fn().mockResolvedValue([]);
    prisma.course_sections.updateMany = jest.fn().mockResolvedValue({ count: 1 });
    prisma.enrollments.create = jest.fn().mockResolvedValue({ id: 'enroll1' });
    await expect(enrollStudent({ studentId: 'student2', sectionId: 'section2' })).resolves.toHaveProperty('id', 'enroll1');
  });
});
