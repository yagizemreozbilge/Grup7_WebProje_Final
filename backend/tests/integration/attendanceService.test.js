jest.mock('../../src/prisma');
jest.mock('../../src/utils/haversine', () => jest.fn());

const prisma = require('../../src/prisma');
const haversine = require('../../src/utils/haversine');
const { checkAttendance, getReport, submitExcuse } =
  require('../../src/services/attendanceService');

describe('AttendanceService - integration tests', () => {

  afterEach(() => jest.clearAllMocks());

  test('throws error if session not found', async () => {
    prisma.attendance_sessions.findUnique.mockResolvedValue(null);

    await expect(
      checkAttendance({ sessionId: 1 })
    ).rejects.toThrow('Session not found');
  });

  test('flags attendance when out of geofence', async () => {
    prisma.attendance_sessions.findUnique.mockResolvedValue({
      latitude: 0,
      longitude: 0,
      geofence_radius: 10
    });

    haversine.mockReturnValue(50);
    prisma.attendance_records.create.mockResolvedValue({});

    const result = await checkAttendance({
      sessionId: 1,
      studentId: 2,
      latitude: 1,
      longitude: 1,
      accuracy: 5
    });

    expect(result.success).toBe(false);
  });

  test('generates attendance report', async () => {
    prisma.enrollments.findMany.mockResolvedValue([
      {
        student: {
          id: 1,
          studentNumber: '123',
          user: { fullName: 'Test User' }
        }
      }
    ]);

    prisma.attendance_sessions.count.mockResolvedValue(10);
    prisma.attendance_records.count.mockResolvedValue(8);

    const report = await getReport(5);

    expect(report[0].absencePercent).toBe(20);
  });

  test('prevents duplicate excuse submission', async () => {
    prisma.excuse_requests.findFirst.mockResolvedValue({ id: 1 });

    await expect(
      submitExcuse({ studentId: 1, sessionId: 2, reason: 'Sick' })
    ).rejects.toThrow();
  });

  test('submits excuse successfully', async () => {
    prisma.excuse_requests.findFirst.mockResolvedValue(null);
    prisma.excuse_requests.create.mockResolvedValue({ id: 10 });

    const excuse = await submitExcuse({
      studentId: 1,
      sessionId: 2,
      reason: 'Sick'
    });

    expect(excuse.id).toBe(10);
  });
});
