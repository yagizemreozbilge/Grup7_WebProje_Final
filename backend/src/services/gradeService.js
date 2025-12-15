// src/services/gradeService.js
const prisma = require('../prisma');
const { calculateLetterGrade, gradePoint, calculateGPA } = require('./gradeCalculationService');

/**
 * Enters grade for a student and updates their GPA
 * @param {string} sectionId - Course section ID
 * @param {string} studentId - Student ID (from students table)
 * @param {number} midtermGrade - Midterm grade (0-100)
 * @param {number} finalGrade - Final grade (0-100)
 */
async function enterGrade({ sectionId, studentId, midtermGrade, finalGrade }) {
    // Validation
    if (midtermGrade < 0 || midtermGrade > 100 || finalGrade < 0 || finalGrade > 100) {
        throw new Error('Grades must be between 0 and 100');
    }

    // Calculate letter grade and grade point
    const letterGrade = calculateLetterGrade(midtermGrade, finalGrade);
    const gradePointValue = gradePoint(letterGrade);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
        // Find enrollment
        const enrollment = await tx.enrollments.findFirst({
            where: {
                student_id: studentId,
                section_id: sectionId,
                status: 'active'
            },
            include: {
                section: {
                    include: {
                        courses: true
                    }
                }
            }
        });

        if (!enrollment) {
            throw new Error('Enrollment not found or student not enrolled in this section');
        }

        // Update enrollment with grades
        const updatedEnrollment = await tx.enrollments.update({
            where: { id: enrollment.id },
            data: {
                midterm_grade: midtermGrade,
                final_grade: finalGrade,
                letter_grade: letterGrade,
                grade_point: gradePointValue,
                status: 'completed' // Mark as completed when grades are entered
            }
        });

        // Update student GPA
        await updateStudentGPA(studentId, tx);

        return updatedEnrollment;
    });

    return result;
}

/**
 * Updates student's GPA and CGPA based on all completed courses
 * @param {string} studentId - Student ID
 * @param {object} tx - Optional Prisma transaction client
 */
async function updateStudentGPA(studentId, tx = prisma) {
    // Get all completed enrollments for this student
    const completedEnrollments = await tx.enrollments.findMany({
        where: {
            student_id: studentId,
            status: 'completed',
            letter_grade: { not: null }
        },
        include: {
            section: {
                include: {
                    courses: true
                }
            }
        }
    });

    if (completedEnrollments.length === 0) {
        // No completed courses yet
        return;
    }

    // Calculate GPA (same as CGPA for now since we're calculating all courses)
    const gradesWithCredits = completedEnrollments.map(e => ({
        letter_grade: e.letter_grade,
        credits: e.section.courses.credits
    }));

    const gpa = calculateGPA(gradesWithCredits);

    // Update student record
    await tx.student.update({
        where: { id: studentId },
        data: {
            gpa: gpa,
            cgpa: gpa // For simplicity, using same value. Could be different with semester logic.
        }
    });

    return gpa;
}

/**
 * Get all students in a section with their current grades
 * @param {string} sectionId - Section ID
 */
async function getSectionGrades(sectionId) {
    const enrollments = await prisma.enrollments.findMany({
        where: { section_id: sectionId },
        include: {
            student: {
                include: {
                    user: true
                }
            }
        },
        orderBy: {
            student: {
                studentNumber: 'asc'
            }
        }
    });

    return enrollments.map(e => ({
        enrollmentId: e.id,
        studentId: e.student_id,
        studentNumber: e.student.studentNumber,
        studentName: e.student.user?.fullName || 'Unknown',
        midtermGrade: e.midterm_grade,
        finalGrade: e.final_grade,
        letterGrade: e.letter_grade,
        gradePoint: e.grade_point,
        status: e.status
    }));
}

module.exports = {
    enterGrade,
    updateStudentGPA,
    getSectionGrades
};
