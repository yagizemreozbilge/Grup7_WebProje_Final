// ============================================================================
// ADMIN CONTROLLER TESTS
// ============================================================================
jest.mock('../../../src/services/userService');
jest.mock('../../../src/prisma', () => ({
    user: {
        findMany: jest.fn()
    },
    faculty: {
        findUnique: jest.fn()
    },
    course_sections: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
    }
}));

const adminController = require('../../../src/controllers/adminController');
const userService = require('../../../src/services/userService');
const prisma = require('../../../src/prisma');

describe('Admin Controller Unit Tests', () => {
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
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('getAllFaculty', () => {
        it('should get all faculty successfully (200)', async () => {
            const mockUsers = [
                {
                    id: 'user1',
                    email: 'faculty1@test.edu',
                    full_name: 'Dr. John Doe',
                    faculty: {
                        id: 'fac1',
                        employee_number: 'EMP001',
                        title: 'Professor',
                        department: 'Computer Science'
                    }
                }
            ];

            userService.getAllUsers.mockResolvedValue({ users: mockUsers });

            await adminController.getAllFaculty(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'fac1',
                        userId: 'user1',
                        fullName: 'Dr. John Doe',
                        email: 'faculty1@test.edu',
                        employeeNumber: 'EMP001',
                        title: 'Professor'
                    })
                ])
            });
        });

        it('should filter out users without faculty profile', async () => {
            const mockUsers = [
                {
                    id: 'user1',
                    email: 'faculty1@test.edu',
                    full_name: 'Dr. John Doe',
                    faculty: {
                        id: 'fac1',
                        employee_number: 'EMP001'
                    }
                },
                {
                    id: 'user2',
                    email: 'user2@test.edu',
                    full_name: 'Regular User',
                    faculty: null
                }
            ];

            userService.getAllUsers.mockResolvedValue({ users: mockUsers });

            await adminController.getAllFaculty(req, res, next);

            const response = res.json.mock.calls[0][0];
            expect(response.data).toHaveLength(1);
            expect(response.data[0].id).toBe('fac1');
        });

        it('should handle service error', async () => {
            const error = new Error('Service error');
            userService.getAllUsers.mockRejectedValue(error);

            await adminController.getAllFaculty(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getAllSections', () => {
        it('should get all sections successfully (200)', async () => {
            const mockSections = [
                {
                    id: 'sec1',
                    course_id: 'c1',
                    section_number: 1,
                    semester: 'Fall',
                    year: 2024,
                    capacity: 30,
                    enrolled_count: 20,
                    instructor_id: 'fac1',
                    deleted_at: null,
                    courses: {
                        id: 'c1',
                        code: 'CS101',
                        name: 'Intro to CS'
                    }
                }
            ];

            const mockInstructor = {
                id: 'fac1',
                user: {
                    fullName: 'Dr. John Doe'
                }
            };

            prisma.course_sections.findMany.mockResolvedValue(mockSections);
            prisma.faculty.findUnique.mockResolvedValue(mockInstructor);

            await adminController.getAllSections(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'sec1',
                        courseCode: 'CS101',
                        courseName: 'Intro to CS',
                        sectionNumber: 1,
                        instructor: expect.objectContaining({
                            id: 'fac1',
                            fullName: 'Dr. John Doe'
                        })
                    })
                ])
            });
        });

        it('should handle sections without instructor', async () => {
            const mockSections = [
                {
                    id: 'sec1',
                    course_id: 'c1',
                    section_number: 1,
                    instructor_id: null,
                    courses: { code: 'CS101', name: 'Intro' },
                    deleted_at: null
                }
            ];

            prisma.course_sections.findMany.mockResolvedValue(mockSections);
            prisma.faculty.findUnique.mockResolvedValue(null);

            await adminController.getAllSections(req, res, next);

            const response = res.json.mock.calls[0][0];
            expect(response.data[0].instructor).toBeNull();
        });

        it('should filter out deleted sections', async () => {
            const mockSections = [
                {
                    id: 'sec1',
                    deleted_at: null,
                    courses: { code: 'CS101', name: 'Intro' }
                },
                {
                    id: 'sec2',
                    deleted_at: new Date(),
                    courses: { code: 'CS102', name: 'Advanced' }
                }
            ];

            prisma.course_sections.findMany.mockResolvedValue([mockSections[0]]);
            prisma.faculty.findUnique.mockResolvedValue(null);

            await adminController.getAllSections(req, res, next);

            const response = res.json.mock.calls[0][0];
            expect(response.data).toHaveLength(1);
            expect(response.data[0].id).toBe('sec1');
        });

        it('should handle database error', async () => {
            const error = new Error('DB Error');
            prisma.course_sections.findMany.mockRejectedValue(error);

            await adminController.getAllSections(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('assignInstructorToSection', () => {
        it('should assign instructor successfully (200)', async () => {
            req.body = { sectionId: 'sec1', instructorId: 'fac1' };

            const mockSection = {
                id: 'sec1',
                deleted_at: null,
                section_number: 1,
                courses: {
                    code: 'CS101',
                    name: 'Intro to CS'
                }
            };

            const mockInstructor = {
                id: 'fac1',
                user: {
                    fullName: 'Dr. John Doe'
                }
            };

            const mockUpdatedSection = {
                id: 'sec1',
                section_number: 1,
                courses: {
                    code: 'CS101',
                    name: 'Intro to CS'
                }
            };

            prisma.course_sections.findUnique.mockResolvedValue(mockSection);
            prisma.faculty.findUnique.mockResolvedValue(mockInstructor);
            prisma.course_sections.update.mockResolvedValue(mockUpdatedSection);
            prisma.faculty.findUnique.mockResolvedValueOnce(mockInstructor);

            await adminController.assignInstructorToSection(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Akademisyen başarıyla atandı',
                data: expect.objectContaining({
                    section: expect.any(Object),
                    instructor: expect.any(Object)
                })
            });
        });

        it('should return 400 if sectionId missing', async () => {
            req.body = { instructorId: 'fac1' };

            await adminController.assignInstructorToSection(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'sectionId ve instructorId gereklidir'
            });
        });

        it('should return 400 if instructorId missing', async () => {
            req.body = { sectionId: 'sec1' };

            await adminController.assignInstructorToSection(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'sectionId ve instructorId gereklidir'
            });
        });

        it('should return 404 if section not found', async () => {
            req.body = { sectionId: 'sec1', instructorId: 'fac1' };
            prisma.course_sections.findUnique.mockResolvedValue(null);

            await adminController.assignInstructorToSection(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Ders şubesi bulunamadı'
            });
        });

        it('should return 404 if section is deleted', async () => {
            req.body = { sectionId: 'sec1', instructorId: 'fac1' };
            prisma.course_sections.findUnique.mockResolvedValue({
                id: 'sec1',
                deleted_at: new Date()
            });

            await adminController.assignInstructorToSection(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Ders şubesi bulunamadı'
            });
        });

        it('should return 404 if instructor not found', async () => {
            req.body = { sectionId: 'sec1', instructorId: 'fac1' };
            prisma.course_sections.findUnique.mockResolvedValue({
                id: 'sec1',
                deleted_at: null
            });
            prisma.faculty.findUnique.mockResolvedValue(null);

            await adminController.assignInstructorToSection(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Akademisyen bulunamadı'
            });
        });

        it('should handle database error', async () => {
            req.body = { sectionId: 'sec1', instructorId: 'fac1' };
            const error = new Error('DB Error');
            prisma.course_sections.findUnique.mockRejectedValue(error);

            await adminController.assignInstructorToSection(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});

