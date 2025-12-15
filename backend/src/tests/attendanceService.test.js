const { checkAttendance } = require('../services/attendanceService');
const prisma = require('../prisma');

describe('AttendanceService', () => {
  it('should flag if out of geofence', async () => {
    prisma.attendance_sessions.findUnique = jest.fn().mockResolvedValue({
      latitude: 41.0, longitude: 29.0, geofence_radius: 10
    });
    prisma.attendance_records.create = jest.fn();
    const result = await checkAttendance({
      sessionId: 'session1', studentId: 'student1', latitude: 41.1, longitude: 29.1, accuracy: 5
    });
    expect(result.success).toBe(false);
    expect(result.distance).toBeGreaterThan(result.allowed);
  });
  it('should not flag if within geofence', async () => {
    prisma.attendance_sessions.findUnique = jest.fn().mockResolvedValue({
      latitude: 41.0, longitude: 29.0, geofence_radius: 10000
    });
    prisma.attendance_records.create = jest.fn();
    const result = await checkAttendance({
      sessionId: 'session2', studentId: 'student2', latitude: 41.01, longitude: 29.01, accuracy: 5
    });
    expect(result.success).toBe(true);
    expect(result.distance).toBeLessThanOrEqual(result.allowed);
  });
});
