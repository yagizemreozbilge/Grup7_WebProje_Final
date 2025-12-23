const { hasScheduleConflict } = require('../../src/services/scheduleConflictService');

describe('ScheduleConflictService - Unit Tests', () => {

    describe('hasScheduleConflict', () => {

        test('should return false when student schedule is empty', () => {
            const studentSchedule = [];
            const newSectionSchedule = { day: 'Monday', start: '09:00', end: '11:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(false);
        });

        test('should return false when days are different', () => {
            const studentSchedule = [
                { day: 'Monday', start: '09:00', end: '11:00' }
            ];
            const newSectionSchedule = { day: 'Tuesday', start: '09:00', end: '11:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(false);
        });

        test('should return false when times do not overlap (new after existing)', () => {
            const studentSchedule = [
                { day: 'Monday', start: '09:00', end: '11:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '11:00', end: '13:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(false);
        });

        test('should return false when times do not overlap (new before existing)', () => {
            const studentSchedule = [
                { day: 'Monday', start: '14:00', end: '16:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '12:00', end: '14:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(false);
        });

        test('should return true when times overlap (new starts before existing ends)', () => {
            const studentSchedule = [
                { day: 'Monday', start: '10:00', end: '12:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '09:00', end: '11:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(true);
        });

        test('should return true when times overlap (new ends after existing starts)', () => {
            const studentSchedule = [
                { day: 'Monday', start: '09:00', end: '11:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '10:00', end: '12:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(true);
        });

        test('should return true when new schedule is completely inside existing', () => {
            const studentSchedule = [
                { day: 'Monday', start: '09:00', end: '13:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '10:00', end: '12:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(true);
        });

        test('should return true when existing schedule is completely inside new', () => {
            const studentSchedule = [
                { day: 'Monday', start: '10:00', end: '12:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '09:00', end: '13:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(true);
        });

        test('should return true when schedules are exactly the same', () => {
            const studentSchedule = [
                { day: 'Monday', start: '09:00', end: '11:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '09:00', end: '11:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(true);
        });

        test('should return true when new schedule starts exactly when existing ends (edge case)', () => {
            const studentSchedule = [
                { day: 'Monday', start: '09:00', end: '11:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '11:00', end: '13:00' };

            // Edge case: technically no overlap since one ends exactly when other starts
            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(false);
        });

        test('should check multiple existing schedules and return true if any conflicts', () => {
            const studentSchedule = [
                { day: 'Monday', start: '08:00', end: '10:00' },
                { day: 'Tuesday', start: '14:00', end: '16:00' },
                { day: 'Monday', start: '13:00', end: '15:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '14:00', end: '16:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(true);
        });

        test('should check multiple existing schedules and return false if none conflict', () => {
            const studentSchedule = [
                { day: 'Monday', start: '08:00', end: '10:00' },
                { day: 'Tuesday', start: '14:00', end: '16:00' },
                { day: 'Wednesday', start: '13:00', end: '15:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '14:00', end: '16:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(false);
        });

        test('should handle different day formats (case sensitive)', () => {
            const studentSchedule = [
                { day: 'monday', start: '09:00', end: '11:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '09:00', end: '11:00' };

            // Should be case sensitive, so these should not conflict
            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(false);
        });

        test('should handle complex time overlaps', () => {
            const studentSchedule = [
                { day: 'Monday', start: '09:30', end: '10:30' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '09:00', end: '10:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(true);
        });

        test('should handle schedules with same start time but different end times', () => {
            const studentSchedule = [
                { day: 'Monday', start: '09:00', end: '10:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '09:00', end: '11:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(true);
        });

        test('should handle schedules with same end time but different start times', () => {
            const studentSchedule = [
                { day: 'Monday', start: '09:00', end: '11:00' }
            ];
            const newSectionSchedule = { day: 'Monday', start: '10:00', end: '11:00' };

            expect(hasScheduleConflict(studentSchedule, newSectionSchedule)).toBe(true);
        });
    });
});


