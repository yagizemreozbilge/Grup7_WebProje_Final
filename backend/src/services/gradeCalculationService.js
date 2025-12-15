// src/services/gradeCalculationService.js
/**
 * Calculates letter grade and GPA/CGPA
 */
function calculateLetterGrade(midterm, final) {
  const total = midterm * 0.4 + final * 0.6;
  if (total >= 90) return 'AA';
  if (total >= 85) return 'BA';
  if (total >= 80) return 'BB';
  if (total >= 75) return 'CB';
  if (total >= 70) return 'CC';
  if (total >= 65) return 'DC';
  if (total >= 60) return 'DD';
  if (total >= 50) return 'FD';
  return 'FF';
}

function gradePoint(letter) {
  switch (letter) {
    case 'AA': return 4.0;
    case 'BA': return 3.5;
    case 'BB': return 3.0;
    case 'CB': return 2.5;
    case 'CC': return 2.0;
    case 'DC': return 1.5;
    case 'DD': return 1.0;
    default: return 0.0;
  }
}

function calculateGPA(grades) {
  if (!grades.length) return 0;
  const total = grades.reduce((sum, g) => sum + (gradePoint(g.letter_grade) * g.credits), 0);
  const credits = grades.reduce((sum, g) => sum + g.credits, 0);
  return credits ? (total / credits) : 0;
}

module.exports = { calculateLetterGrade, gradePoint, calculateGPA };
