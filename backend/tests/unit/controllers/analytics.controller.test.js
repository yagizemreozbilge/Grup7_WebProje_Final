// ============================================================================
// ANALYTICS CONTROLLER TESTS
// ============================================================================
jest.mock('../../../src/prisma', () => ({
    user: {
        count: jest.fn()
    },
    courses: {
        count: jest.fn(),
        findMany: jest.fn()
    },
    enrollments: {
        count: jest.fn(),
        findMany: jest.fn()
    },
    attendance_records: {
        count: jest.fn()
    },
    attendance_sessions: {
        count: jest.fn(),
        findMany: jest.fn()
    },
    mealReservation: {
        count: jest.fn(),
        findMany: jest.fn()
    },
    event: {
        count: jest.fn(),
        findMany: jest.fn()
    },
    student: {
        groupBy: jest.fn(),
        findMany: jest.fn()
    },
    department: {
        findMany: jest.fn()
    },
    cafeteria: {
        findMany: jest.fn()
    },
    transaction: {
        findMany: jest.fn()
    }
}));

const analyticsController = require('../../../src/controllers/analyticsController');
const prisma = require('../../../src/prisma');

describe('Analytics Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { id: 'admin123', role: 'admin' },
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
            send: jest.fn(),
            end: jest.fn()
        };
        next = jest.fn();
    });

    describe('getDashboard', () => {
        it('should get dashboard statistics successfully (200)', async () => {
            prisma.user.count.mockResolvedValue(100);
            prisma.courses.count.mockResolvedValue(50);
            prisma.enrollments.count.mockResolvedValue(200);
            prisma.attendance_records.count.mockResolvedValue(150);
            prisma.attendance_sessions.count.mockResolvedValue(10);
            prisma.mealReservation.count.mockResolvedValue(30);
            prisma.event.count.mockResolvedValue(5);

            await analyticsController.getDashboard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    totalUsers: 100,
                    activeUsersToday: 100,
                    totalCourses: 50,
                    totalEnrollments: 200,
                    attendanceRate: expect.any(Number),
                    mealReservationsToday: 30,
                    upcomingEvents: 5,
                    systemHealth: 'healthy'
                })
            });
        });

        it('should calculate attendance rate correctly', async () => {
            prisma.user.count.mockResolvedValue(100);
            prisma.courses.count.mockResolvedValue(50);
            prisma.enrollments.count.mockResolvedValue(20);
            prisma.attendance_records.count.mockResolvedValue(150);
            prisma.attendance_sessions.count.mockResolvedValue(10);
            prisma.mealReservation.count.mockResolvedValue(30);
            prisma.event.count.mockResolvedValue(5);

            await analyticsController.getDashboard(req, res, next);

            const response = res.json.mock.calls[0][0];
            expect(response.data.attendanceRate).toBeGreaterThanOrEqual(0);
        });

        it('should handle zero attendance rate', async () => {
            prisma.user.count.mockResolvedValue(0);
            prisma.courses.count.mockResolvedValue(0);
            prisma.enrollments.count.mockResolvedValue(0);
            prisma.attendance_records.count.mockResolvedValue(0);
            prisma.attendance_sessions.count.mockResolvedValue(0);
            prisma.mealReservation.count.mockResolvedValue(0);
            prisma.event.count.mockResolvedValue(0);

            await analyticsController.getDashboard(req, res, next);

            const response = res.json.mock.calls[0][0];
            expect(response.data.attendanceRate).toBe(0);
        });

        it('should handle database error', async () => {
            const error = new Error('DB Error');
            prisma.user.count.mockRejectedValue(error);

            await analyticsController.getDashboard(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getAcademicPerformance', () => {
        it('should get academic performance successfully (200)', async () => {
            const mockGpaByDept = [
                { departmentId: 'dept1', _avg: { gpa: 3.5 } }
            ];
            const mockDepartments = [
                { id: 'dept1', name: 'Computer Science' }
            ];
            const mockEnrollments = [
                { letter_grade: 'A' },
                { letter_grade: 'B' },
                { letter_grade: 'C' }
            ];
            const mockStudents = [
                {
                    id: 'st1',
                    studentNumber: 'S001',
                    gpa: 3.8,
                    user: { fullName: 'John Doe', email: 'john@test.edu' },
                    department: { name: 'CS' }
                }
            ];

            prisma.student.groupBy.mockResolvedValue(mockGpaByDept);
            prisma.department.findMany.mockResolvedValue(mockDepartments);
            prisma.enrollments.findMany.mockResolvedValue(mockEnrollments);
            prisma.student.findMany.mockResolvedValue(mockStudents);

            await analyticsController.getAcademicPerformance(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    averageGpaByDepartment: expect.any(Array),
                    gradeDistribution: expect.any(Array),
                    passRate: expect.any(Number),
                    failRate: expect.any(Number),
                    topPerformingStudents: expect.any(Array),
                    atRiskStudents: expect.any(Array)
                })
            });
        });

        it('should handle empty data', async () => {
            prisma.student.groupBy.mockResolvedValue([]);
            prisma.department.findMany.mockResolvedValue([]);
            prisma.enrollments.findMany.mockResolvedValue([]);
            prisma.student.findMany.mockResolvedValue([]);

            await analyticsController.getAcademicPerformance(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle database error', async () => {
            const error = new Error('DB Error');
            prisma.student.groupBy.mockRejectedValue(error);

            await analyticsController.getAcademicPerformance(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getAttendanceAnalytics', () => {
        it('should get attendance analytics successfully (200)', async () => {
            const mockCourses = [
                {
                    id: 'c1',
                    code: 'CS101',
                    name: 'Intro',
                    sections: [
                        {
                            attendanceSessions: [{ attendanceRecords: [] }],
                            enrollments: []
                        }
                    ]
                }
            ];
            const mockSessions = [];
            const mockStudents = [];

            prisma.courses.findMany.mockResolvedValue(mockCourses);
            prisma.attendance_sessions.findMany.mockResolvedValue(mockSessions);
            prisma.student.findMany.mockResolvedValue(mockStudents);

            await analyticsController.getAttendanceAnalytics(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    attendanceByCourse: expect.any(Array),
                    attendanceTrends: expect.any(Array),
                    criticalAbsenceStudents: expect.any(Array),
                    lowAttendanceCourses: expect.any(Array)
                })
            });
        });

        it('should filter by date range', async () => {
            req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };
            prisma.courses.findMany.mockResolvedValue([]);
            prisma.attendance_sessions.findMany.mockResolvedValue([]);
            prisma.student.findMany.mockResolvedValue([]);

            await analyticsController.getAttendanceAnalytics(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle database error', async () => {
            const error = new Error('DB Error');
            prisma.courses.findMany.mockRejectedValue(error);

            await analyticsController.getAttendanceAnalytics(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getMealUsage', () => {
        it('should get meal usage analytics successfully (200)', async () => {
            const mockReservations = [];
            const mockCafeterias = [];
            const mockTransactions = [];

            prisma.mealReservation.findMany.mockResolvedValue(mockReservations);
            prisma.cafeteria.findMany.mockResolvedValue(mockCafeterias);
            prisma.transaction.findMany.mockResolvedValue(mockTransactions);

            await analyticsController.getMealUsage(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    dailyMealCounts: expect.any(Array),
                    cafeteriaUtilization: expect.any(Array),
                    peakHours: expect.any(Array),
                    totalRevenue: expect.any(Number)
                })
            });
        });

        it('should handle database error', async () => {
            const error = new Error('DB Error');
            prisma.mealReservation.findMany.mockRejectedValue(error);

            await analyticsController.getMealUsage(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getEventAnalytics', () => {
        it('should get event analytics successfully (200)', async () => {
            const mockEvents = [
                {
                    id: 'e1',
                    title: 'Event 1',
                    category: 'academic',
                    registeredCount: 50,
                    capacity: 100,
                    registrations: [{ checkedIn: true }, { checkedIn: false }]
                }
            ];

            prisma.event.findMany.mockResolvedValue(mockEvents);

            await analyticsController.getEventAnalytics(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    popularEvents: expect.any(Array),
                    averageRegistrationRate: expect.any(Number),
                    averageCheckInRate: expect.any(Number),
                    eventsWithCheckIns: expect.any(Array),
                    categoryBreakdown: expect.any(Array)
                })
            });
        });

        it('should handle database error', async () => {
            const error = new Error('DB Error');
            prisma.event.findMany.mockRejectedValue(error);

            await analyticsController.getEventAnalytics(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('exportReport', () => {
        it('should return 400 for invalid report type', async () => {
            req.params = { type: 'invalid' };

            await analyticsController.exportReport(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid report type'
            });
        });

        it('should return 400 for invalid format', async () => {
            req.params = { type: 'academic' };
            req.query = { format: 'invalid' };

            await analyticsController.exportReport(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid format. Use excel or csv'
            });
        });
    });
});

