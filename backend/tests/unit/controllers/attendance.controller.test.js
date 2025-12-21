
jest.mock('../../../src/services/attendanceService');
jest.mock('../../../src/prisma', () => ({
    student: { findUnique: jest.fn() }
}));
jest.mock('exceljs', () => ({
    Workbook: jest.fn().mockImplementation(() => ({
        addWorksheet: jest.fn().mockReturnThis(),
        addRow: jest.fn(),
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
        req = { user: { id: 'u1' }, body: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            end: jest.fn()
        };
    });

    it('createSession success', async () => {
        req.body = { section_id: 's1', date: '2025', start_time: '2025', end_time: '2025' };
        attendanceService.createSession.mockResolvedValue({ id: 'sess1' });
        await attendanceController.createSession(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('markAttendance success', async () => {
        req.body = { sessionId: 's1', latitude: 41, longitude: 29 };
        prisma.student.findUnique.mockResolvedValue({ id: 'stu1' });
        attendanceService.checkAttendance.mockResolvedValue({ success: true });
        await attendanceController.markAttendance(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
