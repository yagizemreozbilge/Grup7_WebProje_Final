jest.mock('../../../src/services/gradeService');
jest.mock('../../../src/prisma', () => ({
    attendance_sessions: { create: jest.fn() },
    faculty: { findFirst: jest.fn() },
    course_sections: { findMany: jest.fn(), findUnique: jest.fn() },
    enrollments: { findMany: jest.fn() }
}));

const facultyController = require('../../../src/controllers/facultyController');
const gradeService = require('../../../src/services/gradeService');
const prisma = require('../../../src/prisma');

describe('Faculty Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        // Varsayılan req ve res objeleri
        req = {
            user: { id: 'user123', role: 'faculty' },
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe('startAttendance', () => {
        it('should start attendance successfully (201)', async () => {
            req.body = {
                sectionId: 's1',
                date: '2025-01-01',
                startTime: '2025-01-01T10:00:00',
                endTime: '2025-01-01T11:00:00',
                latitude: 41.0,
                longitude: 29.0
            };
            prisma.attendance_sessions.create.mockResolvedValue({ id: 'sess1' });

            await facultyController.startAttendance(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(prisma.attendance_sessions.create).toHaveBeenCalled();
        });

        it('should return 400 if required fields are missing', async () => {
            req.body = { sectionId: 's1' }; // date, startTime, endTime eksik

            await facultyController.startAttendance(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
        });

        it('should return 500 on database error', async () => {
            req.body = { sectionId: 's1', date: '2025-01-01', startTime: '10:00', endTime: '11:00' };
            prisma.attendance_sessions.create.mockRejectedValue(new Error('DB Error'));

            await facultyController.startAttendance(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('enterGrade', () => {
        it('should enter grade successfully (200)', async () => {
            req.body = { sectionId: 's1', studentId: 'st1', midtermGrade: 80, finalGrade: 90 };
            gradeService.enterGrade.mockResolvedValue({ id: 1 });

            await facultyController.enterGrade(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 400 if sectionId or studentId is missing', async () => {
            req.body = { midtermGrade: 50 };

            await facultyController.enterGrade(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if grades are undefined', async () => {
            req.body = { sectionId: 's1', studentId: 'st1' };

            await facultyController.enterGrade(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if gradeService throws error', async () => {
            req.body = { sectionId: 's1', studentId: 'st1', midtermGrade: 80, finalGrade: 90 };
            gradeService.enterGrade.mockRejectedValue(new Error('Service Error'));

            await facultyController.enterGrade(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe('getSectionGrades', () => {
        it('should get section grades successfully', async () => {
            req.params.sectionId = 's1';
            gradeService.getSectionGrades.mockResolvedValue([{ studentId: 'st1', grade: 100 }]);

            await facultyController.getSectionGrades(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toBeCalledWith(expect.any(Array));
        });

        it('should return 500 on service failure', async () => {
            req.params.sectionId = 's1';
            gradeService.getSectionGrades.mockRejectedValue(new Error('Fail'));

            await facultyController.getSectionGrades(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMySections', () => {
        const mockSections = [
            { id: 'sec1', section_number: 1, courses: { code: 'CS101', name: 'Intro' } }
        ];

        it('should return all sections if user is admin', async () => {
            req.user.role = 'admin';
            prisma.course_sections.findMany.mockResolvedValue(mockSections);

            await facultyController.getMySections(req, res);

            expect(prisma.course_sections.findMany).toHaveBeenCalledWith({
                include: { courses: true }
            });
            expect(res.json).toHaveBeenCalled();
        });

        it('should return faculty-specific sections if user is faculty', async () => {
            req.user.role = 'faculty';
            prisma.faculty.findFirst.mockResolvedValue({ id: 'fac_profile_1' });
            prisma.course_sections.findMany.mockResolvedValue(mockSections);

            await facultyController.getMySections(req, res);

            expect(prisma.faculty.findFirst).toHaveBeenCalledWith({ where: { userId: 'user123' } });
            expect(prisma.course_sections.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { instructor_id: 'fac_profile_1' }
            }));
            expect(res.json).toHaveBeenCalled();
        });

        it('should return 404 if faculty profile is not found', async () => {
            req.user.role = 'faculty';
            prisma.faculty.findFirst.mockResolvedValue(null);

            await facultyController.getMySections(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Öğretim görevlisi profili bulunamadı' });
        });

        it('should return 500 on database error', async () => {
            req.user.role = 'admin';
            prisma.course_sections.findMany.mockRejectedValue(new Error('DB Error'));

            await facultyController.getMySections(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getGradebook', () => {
        it('should get gradebook successfully for admin (200)', async () => {
            req.user.role = 'admin';
            req.params = { sectionId: 'sec1' };
            const mockSection = {
                id: 'sec1',
                instructor_id: 'fac1',
                deleted_at: null,
                courses: { code: 'CS101', name: 'Intro' }
            };
            const mockEnrollments = [
                {
                    id: 'enr1',
                    student_id: 'stu1',
                    student: {
                        id: 'stu1',
                        studentNumber: '12345',
                        user: { fullName: 'Test Student' }
                    },
                    midterm_grade: 80,
                    final_grade: 90,
                    letter_grade: 'A',
                    grade_point: 4.0,
                    status: 'active'
                }
            ];

            prisma.course_sections.findUnique.mockResolvedValue(mockSection);
            prisma.enrollments.findMany.mockResolvedValue(mockEnrollments);

            await facultyController.getGradebook(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                students: expect.arrayContaining([
                    expect.objectContaining({
                        studentId: 'stu1',
                        studentNumber: '12345',
                        fullName: 'Test Student'
                    })
                ])
            });
        });

        it('should get gradebook successfully for faculty (200)', async () => {
            req.user.role = 'faculty';
            req.params = { sectionId: 'sec1' };
            const mockSection = {
                id: 'sec1',
                instructor_id: 'fac1',
                deleted_at: null,
                courses: { code: 'CS101', name: 'Intro' }
            };
            prisma.course_sections.findUnique.mockResolvedValue(mockSection);
            prisma.faculty.findFirst.mockResolvedValue({ id: 'fac1' });
            prisma.enrollments.findMany.mockResolvedValue([]);

            await facultyController.getGradebook(req, res);

            expect(res.json).toHaveBeenCalled();
        });

        it('should return 400 if sectionId missing', async () => {
            req.params = {};
            await facultyController.getGradebook(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if section not found', async () => {
            req.params = { sectionId: 'sec1' };
            prisma.course_sections.findUnique.mockResolvedValue(null);

            await facultyController.getGradebook(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if faculty not authorized', async () => {
            req.user.role = 'faculty';
            req.params = { sectionId: 'sec1' };
            const mockSection = {
                id: 'sec1',
                instructor_id: 'fac2',
                deleted_at: null,
                courses: {}
            };
            prisma.course_sections.findUnique.mockResolvedValue(mockSection);
            prisma.faculty.findFirst.mockResolvedValue({ id: 'fac1' });

            await facultyController.getGradebook(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should handle error (500)', async () => {
            req.params = { sectionId: 'sec1' };
            prisma.course_sections.findUnique.mockRejectedValue(new Error('DB Error'));

            await facultyController.getGradebook(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('saveGradebook', () => {
        it('should save gradebook successfully (200)', async () => {
            req.user.role = 'admin';
            req.params = { sectionId: 'sec1' };
            req.body = {
                grades: {
                    'stu1': { midtermGrade: 80, finalGrade: 90 },
                    'stu2': { midtermGrade: 75, finalGrade: 85 }
                }
            };
            const mockSection = {
                id: 'sec1',
                instructor_id: 'fac1',
                deleted_at: null
            };
            prisma.course_sections.findUnique.mockResolvedValue(mockSection);
            gradeService.enterGrade.mockResolvedValue({ id: 'g1' });

            await facultyController.saveGradebook(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Notlar başarıyla kaydedildi',
                saved: 2
            });
        });

        it('should handle string format grades', async () => {
            req.user.role = 'admin';
            req.params = { sectionId: 'sec1' };
            req.body = {
                grades: {
                    'stu1': '80-90',
                    'stu2': '75'
                }
            };
            const mockSection = {
                id: 'sec1',
                instructor_id: 'fac1',
                deleted_at: null
            };
            prisma.course_sections.findUnique.mockResolvedValue(mockSection);
            gradeService.enterGrade.mockResolvedValue({ id: 'g1' });

            await facultyController.saveGradebook(req, res);

            expect(gradeService.enterGrade).toHaveBeenCalled();
        });

        it('should return 400 if sectionId or grades missing', async () => {
            req.params = { sectionId: 'sec1' };
            req.body = {};
            await facultyController.saveGradebook(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if section not found', async () => {
            req.params = { sectionId: 'sec1' };
            req.body = { grades: { 'stu1': { midtermGrade: 80, finalGrade: 90 } } };
            prisma.course_sections.findUnique.mockResolvedValue(null);

            await facultyController.saveGradebook(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if faculty not authorized', async () => {
            req.user.role = 'faculty';
            req.params = { sectionId: 'sec1' };
            req.body = { grades: { 'stu1': { midtermGrade: 80, finalGrade: 90 } } };
            const mockSection = {
                id: 'sec1',
                instructor_id: 'fac2',
                deleted_at: null
            };
            prisma.course_sections.findUnique.mockResolvedValue(mockSection);
            prisma.faculty.findFirst.mockResolvedValue({ id: 'fac1' });

            await facultyController.saveGradebook(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should skip invalid grade data', async () => {
            req.user.role = 'admin';
            req.params = { sectionId: 'sec1' };
            req.body = {
                grades: {
                    'stu1': { midtermGrade: 80, finalGrade: 90 },
                    'stu2': null,
                    'stu3': 'invalid'
                }
            };
            const mockSection = {
                id: 'sec1',
                instructor_id: 'fac1',
                deleted_at: null
            };
            prisma.course_sections.findUnique.mockResolvedValue(mockSection);
            gradeService.enterGrade.mockResolvedValue({ id: 'g1' });

            await facultyController.saveGradebook(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Notlar başarıyla kaydedildi',
                saved: 1
            });
        });

        it('should handle error (500)', async () => {
            req.params = { sectionId: 'sec1' };
            req.body = { grades: { 'stu1': { midtermGrade: 80, finalGrade: 90 } } };
            prisma.course_sections.findUnique.mockRejectedValue(new Error('DB Error'));

            await facultyController.saveGradebook(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
