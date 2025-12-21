const gradeService = require('../../src/services/gradeService');
const prisma = require('../../src/prisma');
const { calculateLetterGrade, gradePoint, calculateGPA } = require('../../src/services/gradeCalculationService');

jest.mock('../../src/prisma', () => ({
    $transaction: jest.fn(callback => callback(require('../../src/prisma'))),
    enrollments: {
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn()
    },
    student: {
        update: jest.fn()
    }
}));

jest.mock('../../src/services/gradeCalculationService', () => ({
    calculateLetterGrade: jest.fn(),
    gradePoint: jest.fn(),
    calculateGPA: jest.fn()
}));

describe('gradeService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('enterGrade should validate range', async () => {
        await expect(gradeService.enterGrade({ midtermGrade: 110, finalGrade: 80 }))
            .rejects.toThrow('Grades must be between 0 and 100');
    });

    test('enterGrade should throw if enrollment not found', async () => {
        calculateLetterGrade.mockReturnValue('AA');
        gradePoint.mockReturnValue(4.0);
        prisma.enrollments.findFirst.mockResolvedValue(null);

        await expect(gradeService.enterGrade({ sectionId: 's1', studentId: 'stu1', midtermGrade: 80, finalGrade: 90 }))
            .rejects.toThrow('Enrollment not found');
    });

    test('enterGrade should update records and GPA on success', async () => {
        calculateLetterGrade.mockReturnValue('AA');
        gradePoint.mockReturnValue(4.0);
        prisma.enrollments.findFirst.mockResolvedValue({ id: 'enr1', section: { courses: { credits: 3 } } });
        prisma.enrollments.update.mockResolvedValue({ id: 'enr1' });
        prisma.enrollments.findMany.mockResolvedValue([
            { letter_grade: 'AA', section: { courses: { credits: 3 } } }
        ]);
        calculateGPA.mockReturnValue(4.0);

        const result = await gradeService.enterGrade({ sectionId: 's1', studentId: 'stu1', midtermGrade: 80, finalGrade: 90 });
        expect(result.id).toBe('enr1');
        expect(prisma.student.update).toHaveBeenCalled();
    });

    test('getSectionGrades should return formatted records', async () => {
        prisma.enrollments.findMany.mockResolvedValue([
            { id: 'enr1', student_id: 'stu1', midterm_grade: 80, student: { studentNumber: '2021001', user: { fullName: 'John Doe' } } }
        ]);
        const result = await gradeService.getSectionGrades('sec1');
        expect(result[0].studentName).toBe('John Doe');
    });
});
