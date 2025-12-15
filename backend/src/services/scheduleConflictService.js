// src/services/scheduleConflictService.js
/**
 * Checks if a new section schedule conflicts with student's current schedule
 * @param {Array} studentSchedule - Array of section schedules (JSON)
 * @param {Object} newSectionSchedule - Schedule JSON of the new section
 * @returns {boolean}
 */
function hasScheduleConflict(studentSchedule, newSectionSchedule) {
  // Example: Each schedule is { day: 'Monday', start: '09:00', end: '11:00' }
  for (const existing of studentSchedule) {
    if (timeOverlap(existing, newSectionSchedule)) {
      return true;
    }
  }
  return false;
}

function timeOverlap(a, b) {
  // Check if days match
  if (a.day !== b.day) return false;
  // Check if time intervals overlap
  return !(a.end <= b.start || b.end <= a.start);
}

module.exports = { hasScheduleConflict };
