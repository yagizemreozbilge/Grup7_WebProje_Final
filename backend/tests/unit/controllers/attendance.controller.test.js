
jest.mock('../../../src/services/attendanceService');
jest.mock('../../../src/prisma', () => ({
    student: { findUnique: jest.fn() },
    attendance_sessions: { findUnique: jest.fn() },
    enrollments: { findFirst: jest.fn(), findMany: jest.fn() },
    attendance_records: { findFirst: jest.fn(), findMany: jest.fn() },
    course_sections: { findUnique: jest.fn() },
    faculty: { findFirst: jest.fn(), findUnique: jest.fn() }
}));
jest.mock('exceljs', () => ({
    Workbook: jest.fn().mockImplementation(() => ({
        addWorksheet: jest.fn().mockReturnValue({
            columns: [],
            addRow: jest.fn()
        }),
        xlsx: { write: jest.fn(res => { if (res.end) res.end(); return Promise.resolve(); }) }
    }))
}));

const attendanceController = require('../../../src/controllers/attendanceController');
const attendanceService = require('../../../src/services/attendanceService');
const prisma = require('../../../src/prisma');

describe('Attendance Controller Unit Tests', () => {
    let req, res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = { user: { id: 'u1', role: 'student' }, body: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            end: jest.fn()
        };
    });

    describe('createSession', () => {
        it('should create session successfully (201)', async () => {
            req.body = { section_id: 's1', date: '2025-01-01', start_time: '10:00', end_time: '11:00' };
            attendanceService.createSession.mockResolvedValue({ id: 'sess1' });
            await attendanceController.createSession(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(attendanceService.createSession).toHaveBeenCalled();
        });

        it('should return 400 if required fields missing', async () => {
            req.body = { section_id: 's1' };
            await attendanceController.createSession(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should handle error (500)', async () => {
            req.body = { section_id: 's1', date: '2025-01-01', start_time: '10:00', end_time: '11:00' };
            attendanceService.createSession.mockRejectedValue(new Error('DB Error'));
            await attendanceController.createSession(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('markAttendance', () => {
        it('should mark attendance successfully (201)', async () => {
            req.body = { sessionId: 's1', latitude: 41, longitude: 29 };
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            attendanceService.checkAttendance.mockResolvedValue({ success: true });
            await attendanceController.markAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 404 if student not found', async () => {
            req.body = { sessionId: 's1', latitude: 41, longitude: 29 };
            prisma.student.findUnique.mockResolvedValue(null);
            await attendanceController.markAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if required params missing', async () => {
            req.body = { sessionId: 's1' };
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            await attendanceController.markAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should handle flagged attendance (200)', async () => {
            req.body = { sessionId: 's1', latitude: 41, longitude: 29 };
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            attendanceService.checkAttendance.mockResolvedValue({ success: false, flagged: true });
            await attendanceController.markAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle error (400)', async () => {
            req.body = { sessionId: 's1', latitude: 41, longitude: 29 };
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            attendanceService.checkAttendance.mockRejectedValue(new Error('Service Error'));
            await attendanceController.markAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getStatus', () => {
        it('should return status stub (200)', async () => {
            await attendanceController.getStatus(req, res);
            expect(res.json).toHaveBeenCalledWith({ message: 'Yoklama durumu endpointi (stub)' });
        });

        it('should handle error (500)', async () => {
            res.json.mockImplementationOnce(() => { throw new Error('Error'); });
            try {
                await attendanceController.getStatus(req, res);
            } catch (e) {
                expect(res.status).toHaveBeenCalledWith(500);
            }
        });
    });

    describe('getReport', () => {
        it('should get report successfully (200)', async () => {
            req.params = { sectionId: 's1' };
            attendanceService.getReport.mockResolvedValue([]);
            await attendanceController.getReport(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        it('should handle error (500)', async () => {
            req.params = { sectionId: 's1' };
            attendanceService.getReport.mockRejectedValue(new Error('Service Error'));
            await attendanceController.getReport(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('submitExcuse', () => {
        it('should submit excuse successfully (201)', async () => {
            req.body = { sessionId: 's1', reason: 'Illness' };
            attendanceService.submitExcuse.mockResolvedValue({ id: 'exc1' });
            await attendanceController.submitExcuse(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 401 if user not authenticated', async () => {
            req.user = null;
            req.body = { sessionId: 's1', reason: 'Illness' };
            await attendanceController.submitExcuse(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if params missing', async () => {
            req.body = { sessionId: 's1' };
            await attendanceController.submitExcuse(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should handle error (400)', async () => {
            req.body = { sessionId: 's1', reason: 'Illness' };
            attendanceService.submitExcuse.mockRejectedValue(new Error('Service Error'));
            await attendanceController.submitExcuse(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('markAttendanceQR', () => {
        it('should return stub message (200)', async () => {
            await attendanceController.markAttendanceQR(req, res);
            expect(res.json).toHaveBeenCalledWith({ message: 'QR kod ile yoklama endpointi (stub)' });
        });
    });

    describe('giveAttendance', () => {
        it('should give attendance successfully (201)', async () => {
            req.params = { sessionId: 'sess1' };
            req.body = { location: { lat: 41, lng: 29 } };
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            prisma.attendance_sessions.findUnique.mockResolvedValue({
                id: 'sess1',
                section_id: 'sec1',
                status: 'active',
                start_time: new Date(Date.now() - 3600000),
                end_time: new Date(Date.now() + 3600000)
            });
            prisma.enrollments.findFirst.mockResolvedValue({ id: 'enr1', status: 'active' });
            prisma.attendance_records.findFirst.mockResolvedValue(null);
            attendanceService.checkAttendance.mockResolvedValue({ success: true });
            await attendanceController.giveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 403 if not student', async () => {
            req.user.role = 'faculty';
            req.params = { sessionId: 'sess1' };
            await attendanceController.giveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should return 404 if student not found', async () => {
            req.params = { sessionId: 'sess1' };
            req.body = { location: { lat: 41, lng: 29 } };
            prisma.student.findUnique.mockResolvedValue(null);
            await attendanceController.giveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if location missing', async () => {
            req.params = { sessionId: 'sess1' };
            req.body = {};
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            await attendanceController.giveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if session not found', async () => {
            req.params = { sessionId: 'sess1' };
            req.body = { location: { lat: 41, lng: 29 } };
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            prisma.attendance_sessions.findUnique.mockResolvedValue(null);
            await attendanceController.giveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if session not active', async () => {
            req.params = { sessionId: 'sess1' };
            req.body = { location: { lat: 41, lng: 29 } };
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            prisma.attendance_sessions.findUnique.mockResolvedValue({
                id: 'sess1',
                status: 'closed'
            });
            await attendanceController.giveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if session time expired', async () => {
            req.params = { sessionId: 'sess1' };
            req.body = { location: { lat: 41, lng: 29 } };
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            prisma.attendance_sessions.findUnique.mockResolvedValue({
                id: 'sess1',
                section_id: 'sec1',
                status: 'active',
                start_time: new Date(Date.now() - 7200000),
                end_time: new Date(Date.now() - 3600000)
            });
            await attendanceController.giveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 403 if not enrolled', async () => {
            req.params = { sessionId: 'sess1' };
            req.body = { location: { lat: 41, lng: 29 } };
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            prisma.attendance_sessions.findUnique.mockResolvedValue({
                id: 'sess1',
                section_id: 'sec1',
                status: 'active',
                start_time: new Date(Date.now() - 3600000),
                end_time: new Date(Date.now() + 3600000)
            });
            prisma.enrollments.findFirst.mockResolvedValue(null);
            await attendanceController.giveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should return 400 if already gave attendance', async () => {
            req.params = { sessionId: 'sess1' };
            req.body = { location: { lat: 41, lng: 29 } };
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            prisma.attendance_sessions.findUnique.mockResolvedValue({
                id: 'sess1',
                section_id: 'sec1',
                status: 'active',
                start_time: new Date(Date.now() - 3600000),
                end_time: new Date(Date.now() + 3600000)
            });
            prisma.enrollments.findFirst.mockResolvedValue({ id: 'enr1', status: 'active' });
            prisma.attendance_records.findFirst.mockResolvedValue({ id: 'rec1' });
            await attendanceController.giveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should handle flagged attendance (200)', async () => {
            req.params = { sessionId: 'sess1' };
            req.body = { location: { lat: 41, lng: 29 } };
            prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
            prisma.attendance_sessions.findUnique.mockResolvedValue({
                id: 'sess1',
                section_id: 'sec1',
                status: 'active',
                start_time: new Date(Date.now() - 3600000),
                end_time: new Date(Date.now() + 3600000)
            });
            prisma.enrollments.findFirst.mockResolvedValue({ id: 'enr1', status: 'active' });
            prisma.attendance_records.findFirst.mockResolvedValue(null);
            attendanceService.checkAttendance.mockResolvedValue({ success: false, flagged: true });
            await attendanceController.giveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle error (500)', async () => {
            req.params = { sessionId: 'sess1' };
            req.body = { location: { lat: 41, lng: 29 } };
            prisma.student.findUnique.mockRejectedValue(new Error('DB Error'));
            await attendanceController.giveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getSessionAttendance', () => {
        it('should get session attendance successfully for admin (200)', async () => {
            req.user.role = 'admin';
            req.params = { sessionId: 'sess1' };
            prisma.attendance_sessions.findUnique.mockResolvedValue({
                id: 'sess1',
                section_id: 'sec1',
                section: {
                    instructor_id: 'fac1',
                    courses: { code: 'CS101', name: 'Intro' }
                }
            });
            prisma.attendance_records.findMany.mockResolvedValue([]);
            prisma.enrollments.findMany.mockResolvedValue([]);
            await attendanceController.getSessionAttendance(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        it('should get session attendance successfully for faculty (200)', async () => {
            req.user.role = 'faculty';
            req.params = { sessionId: 'sess1' };
            prisma.attendance_sessions.findUnique.mockResolvedValue({
                id: 'sess1',
                section_id: 'sec1',
                section: {
                    instructor_id: 'fac1',
                    courses: { code: 'CS101', name: 'Intro' }
                }
            });
            prisma.faculty.findFirst.mockResolvedValue({ id: 'fac1' });
            prisma.faculty.findUnique.mockResolvedValue({ id: 'fac1', user: { id: 'u1' } });
            prisma.attendance_records.findMany.mockResolvedValue([]);
            prisma.enrollments.findMany.mockResolvedValue([]);
            await attendanceController.getSessionAttendance(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        it('should return 404 if session not found', async () => {
            req.params = { sessionId: 'sess1' };
            prisma.attendance_sessions.findUnique.mockResolvedValue(null);
            await attendanceController.getSessionAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if not admin or faculty', async () => {
            req.user.role = 'student';
            req.params = { sessionId: 'sess1' };
            prisma.attendance_sessions.findUnique.mockResolvedValue({
                id: 'sess1',
                section_id: 'sec1',
                section: { instructor_id: 'fac1', courses: {} }
            });
            await attendanceController.getSessionAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should return 403 if faculty not instructor', async () => {
            req.user.role = 'faculty';
            req.params = { sessionId: 'sess1' };
            prisma.attendance_sessions.findUnique.mockResolvedValue({
                id: 'sess1',
                section_id: 'sec1',
                section: {
                    instructor_id: 'fac2',
                    courses: {}
                }
            });
            prisma.faculty.findFirst.mockResolvedValue({ id: 'fac1' });
            await attendanceController.getSessionAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should handle error (500)', async () => {
            req.user.role = 'admin';
            req.params = { sessionId: 'sess1' };
            prisma.attendance_sessions.findUnique.mockRejectedValue(new Error('DB Error'));
            await attendanceController.getSessionAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('exportReportExcel', () => {
        it('should export report successfully (200)', async () => {
            req.params = { sectionId: 's1' };
            attendanceService.getReport.mockResolvedValue([
                { studentNumber: '123', fullName: 'Test', presentCount: 10, totalCount: 12, absencePercent: 16.67 }
            ]);
            await attendanceController.exportReportExcel(req, res);
            expect(res.setHeader).toHaveBeenCalled();
        });

        it('should handle error (500)', async () => {
            req.params = { sectionId: 's1' };
            attendanceService.getReport.mockRejectedValue(new Error('Service Error'));
            await attendanceController.exportReportExcel(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
