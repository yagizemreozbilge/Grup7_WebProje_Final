const attendanceService = require('../../src/services/attendanceService');
const prisma = require('../../src/prisma');

jest.mock('../../src/prisma', () => ({
    attendance_sessions: { findUnique: jest.fn(), create: jest.fn(), count: jest.fn() },
    attendance_records: { create: jest.fn(), count: jest.fn() },
    enrollments: { findMany: jest.fn() },
    excuse_requests: { findFirst: jest.fn(), create: jest.fn() }
}));

describe('attendanceService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('checkAttendance should throw if session not found', async () => {
        prisma.attendance_sessions.findUnique.mockResolvedValue(null);
        await expect(attendanceService.checkAttendance({ sessionId: 's1', studentId: 'stu1' }))
            .rejects.toThrow('Session not found');
    });

    test('checkAttendance should flag if student is out of geofence', async () => {
        prisma.attendance_sessions.findUnique.mockResolvedValue({
            id: 's1', latitude: 40, longitude: 30, geofence_radius: 15
        });
        // distance will be large
        const result = await attendanceService.checkAttendance({
            sessionId: 's1', studentId: 'stu1', latitude: 45, longitude: 35
        });
        expect(result.success).toBe(false);
        expect(prisma.attendance_records.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ is_flagged: true })
        }));
    });

    test('createSession should call prisma.create', async () => {
        prisma.attendance_sessions.create.mockResolvedValue({ id: 'new-s' });
        const result = await attendanceService.createSession({
            section_id: 'sec1', instructor_id: 'ins1', date: '2025-01-01',
            start_time: '2025-01-01T10:00:00', end_time: '2025-01-01T11:00:00'
        });
        expect(result.id).toBe('new-s');
    });

    test('getReport should calculate percentages correctly', async () => {
        prisma.enrollments.findMany.mockResolvedValue([
            { student: { id: 'stu1', studentNumber: '101', user: { fullName: 'Name' } } }
        ]);
        prisma.attendance_sessions.count.mockResolvedValue(10);
        prisma.attendance_records.count.mockResolvedValue(8); // present 8/10

        const result = await attendanceService.getReport('sec1');
        expect(result[0].absencePercent).toBe(20);
    });

    test('submitExcuse should throw if already exists', async () => {
        prisma.excuse_requests.findFirst.mockResolvedValue({ id: 'ex1' });
        await expect(attendanceService.submitExcuse({ studentId: 'stu1', sessionId: 's1', reason: 'sick' }))
            .rejects.toThrow('Bu oturum için zaten mazeret talebiniz var.');
    });

    test('submitExcuse should create if not exists', async () => {
        prisma.excuse_requests.findFirst.mockResolvedValue(null);
        prisma.excuse_requests.create.mockResolvedValue({ id: 'new-ex' });
        const result = await attendanceService.submitExcuse({ studentId: 'stu1', sessionId: 's1', reason: 'sick' });
        expect(result.id).toBe('new-ex');
    });
});
