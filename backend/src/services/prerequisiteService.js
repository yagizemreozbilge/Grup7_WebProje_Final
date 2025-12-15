// src/services/prerequisiteService.js
const prisma = require('../prisma');

/**
 * Recursive prerequisite check for a course and student
 * Throws error if any prerequisite is not completed
 */
async function checkPrerequisites(courseId, studentId) {
  // Get all prerequisites for the course
  const prereqs = await prisma.course_prerequisites.findMany({
    where: { course_id: courseId },
    select: { prerequisite_course_id: true }
  });
  for (const prereq of prereqs) {
    // Check if student has completed the prerequisite
    const completed = await prisma.enrollments.findFirst({
      where: {
        student_id: studentId,
        section: {
          course_id: prereq.prerequisite_course_id
        },
        status: 'completed',
        letter_grade: { not: null }
      }
    });
    if (!completed) {
      throw new Error('Prerequisite not met');
    }
    // Recursive check
    await checkPrerequisites(prereq.prerequisite_course_id, studentId);
  }
}

module.exports = { checkPrerequisites };
