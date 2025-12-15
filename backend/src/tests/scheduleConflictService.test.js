const { hasScheduleConflict } = require('../services/scheduleConflictService');

describe('ScheduleConflictService', () => {
  it('should detect conflict on same day/time', () => {
    const studentSchedule = [{ day: 'Monday', start: '09:00', end: '11:00' }];
    const newSection = { day: 'Monday', start: '10:00', end: '12:00' };
    expect(hasScheduleConflict(studentSchedule, newSection)).toBe(true);
  });
  it('should not detect conflict on different day', () => {
    const studentSchedule = [{ day: 'Monday', start: '09:00', end: '11:00' }];
    const newSection = { day: 'Tuesday', start: '09:00', end: '11:00' };
    expect(hasScheduleConflict(studentSchedule, newSection)).toBe(false);
  });
});
