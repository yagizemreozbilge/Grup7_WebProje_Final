const {
    calculateLetterGrade,
    gradePoint,
    calculateGPA
} = require('../../src/services/gradeCalculationService');

describe('Grade Calculation Service Unit Tests', () => {

    // Test calculateLetterGrade
    describe('calculateLetterGrade', () => {
        it('should return AA for score >= 90', () => {
            expect(calculateLetterGrade(90, 90)).toBe('AA');
            expect(calculateLetterGrade(80, 100)).toBe('AA'); // (32 + 60 = 92)
        });

        it('should return BA for 85-89', () => {
            expect(calculateLetterGrade(85, 85)).toBe('BA');
        });

        it('should return FF for fail', () => {
            expect(calculateLetterGrade(20, 30)).toBe('FF');
        });

        it('should calculate weighted average correctly (40% midterm, 60% final)', () => {
            // Midterm 50 (*0.4=20), Final 100 (*0.6=60) => 80 => BB
            expect(calculateLetterGrade(50, 100)).toBe('BB');
        });
    });

    // Test gradePoint
    describe('gradePoint', () => {
        it('should return correct points', () => {
            expect(gradePoint('AA')).toBe(4.0);
            expect(gradePoint('BA')).toBe(3.5);
            expect(gradePoint('BB')).toBe(3.0);
            expect(gradePoint('CB')).toBe(2.5);
            expect(gradePoint('CC')).toBe(2.0);
            expect(gradePoint('DC')).toBe(1.5);
            expect(gradePoint('DD')).toBe(1.0);
            expect(gradePoint('FF')).toBe(0.0);
            expect(gradePoint('FD')).toBe(0.0);
        });

        it('should return 0 for unknown grade', () => {
            expect(gradePoint('XYZ')).toBe(0.0);
        });
    });

    // Test calculateGPA
    describe('calculateGPA', () => {
        it('should return 0 for empty grades', () => {
            expect(calculateGPA([])).toBe(0);
        });

        it('should calculate GPA correctly for single course', () => {
            const grades = [{ letter_grade: 'AA', credits: 3 }];
            // 4.0 * 3 / 3 = 4.0
            expect(calculateGPA(grades)).toBe(4.0);
        });

        it('should calculate GPA correctly for multiple courses', () => {
            const grades = [
                { letter_grade: 'AA', credits: 3 }, // 12 points
                { letter_grade: 'CC', credits: 2 }  // 4 points
            ];
            // Total points: 16
            // Total credits: 5
            // GPA: 16 / 5 = 3.2
            expect(calculateGPA(grades)).toBe(3.2);
        });

        it('should handle zero credits gracefully', () => {
            const grades = [{ letter_grade: 'AA', credits: 0 }];
            expect(calculateGPA(grades)).toBe(0);
        });
    });
});
