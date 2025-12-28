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

    test('submitExcuse should throw if missing parameters', async () => {
        await expect(attendanceService.submitExcuse({ studentId: 'stu1' }))
            .rejects.toThrow('Eksik parametre');
        await expect(attendanceService.submitExcuse({ sessionId: 's1' }))
            .rejects.toThrow('Eksik parametre');
        await expect(attendanceService.submitExcuse({ studentId: 'stu1', sessionId: 's1' }))
            .rejects.toThrow('Eksik parametre');
    });

    test('checkAttendance should succeed when within geofence', async () => {
        prisma.attendance_sessions.findUnique.mockResolvedValue({
            id: 's1', latitude: 40, longitude: 30, geofence_radius: 15
        });
        const result = await attendanceService.checkAttendance({
            sessionId: 's1', studentId: 'stu1', latitude: 40.0001, longitude: 30.0001, accuracy: 5
        });
        expect(result.success).toBe(true);
        expect(prisma.attendance_records.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ is_flagged: false })
        }));
    });

    test('checkAttendance should use default accuracy if not provided', async () => {
        prisma.attendance_sessions.findUnique.mockResolvedValue({
            id: 's1', latitude: 40, longitude: 30, geofence_radius: 15
        });
        await attendanceService.checkAttendance({
            sessionId: 's1', studentId: 'stu1', latitude: 40.0001, longitude: 30.0001
        });
        expect(prisma.attendance_records.create).toHaveBeenCalled();
    });

    test('createSession should use default latitude/longitude if not provided', async () => {
        prisma.attendance_sessions.create.mockResolvedValue({ id: 'new-s' });
        const result = await attendanceService.createSession({
            section_id: 'sec1', instructor_id: 'ins1', date: '2025-01-01',
            start_time: '2025-01-01T10:00:00', end_time: '2025-01-01T11:00:00'
        });
        expect(prisma.attendance_sessions.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ latitude: 0, longitude: 0 })
        }));
    });

    test('createSession should use provided latitude/longitude', async () => {
        prisma.attendance_sessions.create.mockResolvedValue({ id: 'new-s' });
        await attendanceService.createSession({
            section_id: 'sec1', instructor_id: 'ins1', date: '2025-01-01',
            start_time: '2025-01-01T10:00:00', end_time: '2025-01-01T11:00:00',
            latitude: 40.5, longitude: 30.5
        });
        expect(prisma.attendance_sessions.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ latitude: 40.5, longitude: 30.5 })
        }));
    });

    test('getReport should handle empty enrollments', async () => {
        prisma.enrollments.findMany.mockResolvedValue([]);
        prisma.attendance_sessions.count.mockResolvedValue(10);
        const result = await attendanceService.getReport('sec1');
        expect(result).toEqual([]);
    });

    test('getReport should handle zero total sessions', async () => {
        prisma.enrollments.findMany.mockResolvedValue([
            { student: { id: 'stu1', studentNumber: '101', user: { fullName: 'Name' } } }
        ]);
        prisma.attendance_sessions.count.mockResolvedValue(0);
        prisma.attendance_records.count.mockResolvedValue(0);
        const result = await attendanceService.getReport('sec1');
        expect(result[0].absencePercent).toBe(0);
    });

    test('getReport should handle student without user', async () => {
        prisma.enrollments.findMany.mockResolvedValue([
            { student: { id: 'stu1', studentNumber: '101', user: null } }
        ]);
        prisma.attendance_sessions.count.mockResolvedValue(10);
        prisma.attendance_records.count.mockResolvedValue(8);
        const result = await attendanceService.getReport('sec1');
        expect(result[0].fullName).toBe('Bilinmiyor');
    });

    test('getReport should handle student without studentNumber', async () => {
        prisma.enrollments.findMany.mockResolvedValue([
            { student: { id: 'stu1', studentNumber: null, user: { fullName: 'Name' } } }
        ]);
        prisma.attendance_sessions.count.mockResolvedValue(10);
        prisma.attendance_records.count.mockResolvedValue(8);
        const result = await attendanceService.getReport('sec1');
        expect(result[0].studentNumber).toBe('N/A');
    });

    test('getReport should skip enrollment if student is null', async () => {
        prisma.enrollments.findMany.mockResolvedValue([
            { student: null }
        ]);
        prisma.attendance_sessions.count.mockResolvedValue(10);
        const result = await attendanceService.getReport('sec1');
        expect(result).toEqual([]);
    });

    test('markAttendance should be callable (stub)', async () => {
        // Stub function, just check it exists
        expect(typeof attendanceService.markAttendance).toBe('function');
        await expect(attendanceService.markAttendance({})).resolves.toBeUndefined();
    });

    test('getStatus should be callable (stub)', async () => {
        // Stub function, just check it exists
        expect(typeof attendanceService.getStatus).toBe('function');
        await expect(attendanceService.getStatus('user1', 'session1')).resolves.toBeUndefined();
    });

    test('markAttendanceQR should be callable (stub)', async () => {
        // Stub function, just check it exists
        expect(typeof attendanceService.markAttendanceQR).toBe('function');
        await expect(attendanceService.markAttendanceQR({})).resolves.toBeUndefined();
    });
});
