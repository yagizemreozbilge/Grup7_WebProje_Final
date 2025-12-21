// ============================================================================
// STUDENT CONTROLLER TESTS
// ============================================================================
jest.mock('../../../src/services/enrollmentService');
jest.mock('../../../src/prisma', () => ({
    student: {
        findUnique: jest.fn()
    },
    enrollments: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn()
    },
    course_sections: {
        findMany: jest.fn(),
        update: jest.fn()
    },
    attendance_records: {
        findMany: jest.fn(),
        count: jest.fn()
    },
    attendance_sessions: {
        count: jest.fn()
    },
    $transaction: jest.fn()
}));

const studentController = require('../../../src/controllers/studentController');
const enrollmentService = require('../../../src/services/enrollmentService');
const prisma = require('../../../src/prisma');

describe('Student Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { id: 'user123' },
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe('getGrades', () => {
        it('should get student grades successfully (200)', async () => {
            const mockStudent = { id: 'st1', gpa: 3.5, cgpa: 3.4 };
            const mockEnrollments = [
                {
                    section: {
                        id: 'sec1',
                        semester: 'Fall',
                        year: 2024,
                        courses: {
                            id: 'c1',
                            code: 'CS101',
                            name: 'Intro to CS',
                            credits: 3
                        }
                    },
                    letter_grade: 'A',
                    final_grade: 90,
                    midterm_grade: 85
                }
            ];

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.enrollments.findMany.mockResolvedValue(mockEnrollments);

            await studentController.getGrades(req, res);

            expect(res.json).toHaveBeenCalledWith({
                grades: expect.arrayContaining([
                    expect.objectContaining({
                        courseCode: 'CS101',
                        courseName: 'Intro to CS',
                        letterGrade: 'A',
                        score: 90
                    })
                ]),
                gpa: 3.5,
                cgpa: 3.4
            });
        });

        it('should return empty grades if student not found', async () => {
            prisma.student.findUnique.mockResolvedValue(null);

            await studentController.getGrades(req, res);

            expect(res.json).toHaveBeenCalledWith({
                grades: [],
                gpa: null,
                cgpa: null
            });
        });

        it('should return empty grades if no enrollments', async () => {
            const mockStudent = { id: 'st1', gpa: 3.5, cgpa: 3.4 };
            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.enrollments.findMany.mockResolvedValue([]);

            await studentController.getGrades(req, res);

            expect(res.json).toHaveBeenCalledWith({
                grades: [],
                gpa: 3.5,
                cgpa: 3.4
            });
        });

        it('should return 500 on database error', async () => {
            const error = new Error('DB Error');
            prisma.student.findUnique.mockRejectedValue(error);

            await studentController.getGrades(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Notlar yüklenemedi',
                details: error.message
            });
        });
    });

    describe('getMyCourses', () => {
        it('should get student courses successfully (200)', async () => {
            const mockStudent = { id: 'st1' };
            const mockEnrollments = [
                {
                    status: 'active',
                    section: {
                        section_number: 1,
                        courses: {
                            id: 'c1',
                            code: 'CS101',
                            name: 'Intro to CS'
                        }
                    }
                }
            ];

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.enrollments.findMany.mockResolvedValue(mockEnrollments);

            await studentController.getMyCourses(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        code: 'CS101',
                        name: 'Intro to CS',
                        status: 'active',
                        statusText: 'Kayıtlı'
                    })
                ])
            );
        });

        it('should return empty array if student not found', async () => {
            prisma.student.findUnique.mockResolvedValue(null);

            await studentController.getMyCourses(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should return empty array if no enrollments', async () => {
            const mockStudent = { id: 'st1' };
            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.enrollments.findMany.mockResolvedValue([]);

            await studentController.getMyCourses(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should return 500 on database error', async () => {
            const error = new Error('DB Error');
            prisma.student.findUnique.mockRejectedValue(error);

            await studentController.getMyCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Dersler yüklenemedi',
                details: error.message
            });
        });
    });

    describe('enrollCourse', () => {
        it('should enroll student in course successfully (201)', async () => {
            req.body = { sectionId: 'sec1' };
            const mockStudent = { id: 'st1' };
            const mockEnrollment = { id: 'enr1', student_id: 'st1', section_id: 'sec1' };

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            enrollmentService.enrollStudent.mockResolvedValue(mockEnrollment);

            await studentController.enrollCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Derse kayıt başarılı',
                data: mockEnrollment
            });
        });

        it('should return 404 if student not found', async () => {
            req.body = { sectionId: 'sec1' };
            prisma.student.findUnique.mockResolvedValue(null);

            await studentController.enrollCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Öğrenci kaydı bulunamadı'
            });
        });

        it('should return 400 on enrollment service error', async () => {
            req.body = { sectionId: 'sec1' };
            const mockStudent = { id: 'st1' };
            const error = new Error('Enrollment failed');

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            enrollmentService.enrollStudent.mockRejectedValue(error);

            await studentController.enrollCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: error.message
            });
        });
    });

    describe('dropCourse', () => {
        it('should drop course successfully (200)', async () => {
            req.body = { sectionId: 'sec1' };
            const mockStudent = { id: 'st1' };
            const mockEnrollment = {
                id: 'enr1',
                student_id: 'st1',
                section_id: 'sec1',
                status: 'active'
            };

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.enrollments.findFirst.mockResolvedValue(mockEnrollment);
            
            prisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    enrollments: {
                        update: jest.fn().mockResolvedValue({})
                    },
                    course_sections: {
                        update: jest.fn().mockResolvedValue({})
                    }
                });
            });

            await studentController.dropCourse(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Ders başarıyla bırakıldı'
            });
        });

        it('should return 404 if student not found', async () => {
            req.body = { sectionId: 'sec1' };
            prisma.student.findUnique.mockResolvedValue(null);

            await studentController.dropCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Öğrenci kaydı bulunamadı'
            });
        });

        it('should return 404 if enrollment not found', async () => {
            req.body = { sectionId: 'sec1' };
            const mockStudent = { id: 'st1' };
            
            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.enrollments.findFirst.mockResolvedValue(null);

            await studentController.dropCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Kayıt bulunamadı veya zaten bırakılmış.'
            });
        });

        it('should return 500 on database error', async () => {
            req.body = { sectionId: 'sec1' };
            const error = new Error('DB Error');
            prisma.student.findUnique.mockRejectedValue(error);

            await studentController.dropCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: error.message
            });
        });
    });

    describe('getAvailableCourses', () => {
        it('should get available courses successfully (200)', async () => {
            const mockStudent = { id: 'st1' };
            const mockSections = [
                {
                    id: 'sec1',
                    course_id: 'c1',
                    section_number: 1,
                    semester: 'Fall',
                    year: 2024,
                    capacity: 30,
                    enrolled_count: 20,
                    courses: {
                        code: 'CS101',
                        name: 'Intro to CS',
                        credits: 3,
                        is_active: true,
                        deleted_at: null
                    },
                    deleted_at: null
                }
            ];
            const mockEnrollments = [];

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.course_sections.findMany.mockResolvedValue(mockSections);
            prisma.enrollments.findMany.mockResolvedValue(mockEnrollments);

            await studentController.getAvailableCourses(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        sectionId: 'sec1',
                        courseCode: 'CS101',
                        courseName: 'Intro to CS',
                        capacity: 30,
                        enrolledCount: 20
                    })
                ])
            );
        });

        it('should filter out enrolled courses', async () => {
            const mockStudent = { id: 'st1' };
            const mockSections = [
                {
                    id: 'sec1',
                    courses: { code: 'CS101', is_active: true, deleted_at: null },
                    deleted_at: null
                },
                {
                    id: 'sec2',
                    courses: { code: 'CS102', is_active: true, deleted_at: null },
                    deleted_at: null
                }
            ];
            const mockEnrollments = [{ section_id: 'sec1' }];

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.course_sections.findMany.mockResolvedValue(mockSections);
            prisma.enrollments.findMany.mockResolvedValue(mockEnrollments);

            await studentController.getAvailableCourses(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response).toHaveLength(1);
            expect(response[0].sectionId).toBe('sec2');
        });

        it('should return 404 if student not found', async () => {
            prisma.student.findUnique.mockResolvedValue(null);

            await studentController.getAvailableCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Öğrenci kaydı bulunamadı'
            });
        });

        it('should return 500 on database error', async () => {
            const error = new Error('DB Error');
            prisma.student.findUnique.mockRejectedValue(error);

            await studentController.getAvailableCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Dersler yüklenemedi',
                details: error.message
            });
        });
    });

    describe('getMyAttendance', () => {
        it('should get attendance records successfully (200)', async () => {
            const mockStudent = { id: 'st1' };
            const mockRecords = [
                {
                    id: 'rec1',
                    check_in_time: new Date(),
                    is_flagged: false,
                    distance_from_center: 10,
                    flag_reason: null,
                    session: {
                        date: new Date(),
                        section: {
                            courses: {
                                code: 'CS101',
                                name: 'Intro to CS'
                            }
                        }
                    }
                }
            ];

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.attendance_records.findMany.mockResolvedValue(mockRecords);

            await studentController.getMyAttendance(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        courseCode: 'CS101',
                        courseName: 'Intro to CS',
                        status: 'present'
                    })
                ])
            );
        });

        it('should return empty array if student not found', async () => {
            prisma.student.findUnique.mockResolvedValue(null);

            await studentController.getMyAttendance(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should mark flagged records correctly', async () => {
            const mockStudent = { id: 'st1' };
            const mockRecords = [
                {
                    id: 'rec1',
                    is_flagged: true,
                    flag_reason: 'Distance too far',
                    session: {
                        section: {
                            courses: { code: 'CS101', name: 'Intro' }
                        }
                    }
                }
            ];

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.attendance_records.findMany.mockResolvedValue(mockRecords);

            await studentController.getMyAttendance(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response[0].status).toBe('flagged');
            expect(response[0].flagReason).toBe('Distance too far');
        });

        it('should return 500 on database error', async () => {
            const error = new Error('DB Error');
            prisma.student.findUnique.mockRejectedValue(error);

            await studentController.getMyAttendance(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Yoklama geçmişi yüklenemedi',
                details: error.message
            });
        });
    });

    describe('getAttendanceSummary', () => {
        it('should get attendance summary successfully (200)', async () => {
            const mockStudent = { id: 'st1' };
            const mockEnrollments = [
                {
                    section_id: 'sec1',
                    section: {
                        courses: {
                            code: 'CS101',
                            name: 'Intro to CS',
                            attendance_limit: 4
                        }
                    }
                }
            ];

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.enrollments.findMany.mockResolvedValue(mockEnrollments);
            prisma.attendance_sessions.count.mockResolvedValue(10);
            prisma.attendance_records.count.mockResolvedValue(8);

            await studentController.getAttendanceSummary(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        courseCode: 'CS101',
                        courseName: 'Intro to CS',
                        limit: 4,
                        absent: 2,
                        attended: 8,
                        totalSessions: 10,
                        remaining: 2,
                        status: 'good'
                    })
                ])
            );
        });

        it('should return critical status when limit reached', async () => {
            const mockStudent = { id: 'st1' };
            const mockEnrollments = [
                {
                    section_id: 'sec1',
                    section: {
                        courses: {
                            code: 'CS101',
                            name: 'Intro',
                            attendance_limit: 4
                        }
                    }
                }
            ];

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.enrollments.findMany.mockResolvedValue(mockEnrollments);
            prisma.attendance_sessions.count.mockResolvedValue(10);
            prisma.attendance_records.count.mockResolvedValue(6);

            await studentController.getAttendanceSummary(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response[0].status).toBe('critical');
            expect(response[0].remaining).toBe(0);
        });

        it('should return warning status when limit almost reached', async () => {
            const mockStudent = { id: 'st1' };
            const mockEnrollments = [
                {
                    section_id: 'sec1',
                    section: {
                        courses: {
                            code: 'CS101',
                            name: 'Intro',
                            attendance_limit: 4
                        }
                    }
                }
            ];

            prisma.student.findUnique.mockResolvedValue(mockStudent);
            prisma.enrollments.findMany.mockResolvedValue(mockEnrollments);
            prisma.attendance_sessions.count.mockResolvedValue(10);
            prisma.attendance_records.count.mockResolvedValue(7);

            await studentController.getAttendanceSummary(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response[0].status).toBe('warning');
            expect(response[0].remaining).toBe(1);
        });

        it('should return empty array if student not found', async () => {
            prisma.student.findUnique.mockResolvedValue(null);

            await studentController.getAttendanceSummary(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should return 500 on database error', async () => {
            const error = new Error('DB Error');
            prisma.student.findUnique.mockRejectedValue(error);

            await studentController.getAttendanceSummary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Özet yüklenemedi',
                details: error.message
            });
        });
    });
});