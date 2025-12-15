const { calculateLetterGrade, gradePoint, calculateGPA } = require('../services/gradeCalculationService');

describe('GradeCalculationService', () => {
  it('should calculate correct letter grade', () => {
    expect(calculateLetterGrade(90, 90)).toBe('AA');
    expect(calculateLetterGrade(80, 80)).toBe('BB');
    expect(calculateLetterGrade(60, 60)).toBe('DD');
    expect(calculateLetterGrade(40, 40)).toBe('FF');
  });
  it('should calculate correct grade point', () => {
    expect(gradePoint('AA')).toBe(4.0);
    expect(gradePoint('CC')).toBe(2.0);
    expect(gradePoint('FF')).toBe(0.0);
  });
  it('should calculate GPA', () => {
    const grades = [
      { letter_grade: 'AA', credits: 3 },
      { letter_grade: 'BB', credits: 2 },
    ];
    expect(calculateGPA(grades)).toBeCloseTo(3.6);
  });
});
