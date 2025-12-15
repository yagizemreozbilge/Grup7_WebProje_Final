// src/services/enrollmentService.js
const prisma = require('../prisma');
const { checkPrerequisites } = require('./prerequisiteService');
const { hasScheduleConflict } = require('./scheduleConflictService');

/**
 * Handles enrollment logic: prerequisite, conflict, capacity
 */
async function enrollStudent({ studentId, sectionId }) {
  // Get section info
  const section = await prisma.course_sections.findUnique({
    where: { id: sectionId },
    include: { courses: true }
  });
  if (!section) throw new Error('Section not found');

  // Prerequisite check
  await checkPrerequisites(section.course_id, studentId);

  // Schedule conflict check
  const studentEnrollments = await prisma.enrollments.findMany({
    where: { student_id: studentId, status: 'active' },
    include: { section: true }
  });
  const studentSchedule = studentEnrollments.map(e => e.section.schedule_json).filter(Boolean);
  if (section.schedule_json && hasScheduleConflict(studentSchedule, section.schedule_json)) {
    throw new Error('Schedule conflict');
  }

  // Capacity check (atomic)
  const updated = await prisma.course_sections.updateMany({
    where: { id: sectionId, enrolled_count: { lt: section.capacity } },
    data: { enrolled_count: { increment: 1 } }
  });
  if (updated.count === 0) throw new Error('Section is full');

  // Create enrollment
  const enrollment = await prisma.enrollments.create({
    data: { student_id: studentId, section_id: sectionId }
  });
  return enrollment;
}

module.exports = { enrollStudent };
