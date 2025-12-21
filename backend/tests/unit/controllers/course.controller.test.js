jest.mock('../../../src/prisma', () => ({
    courses: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
    }
}));

const courseController = require('../../../src/controllers/courseController');
const prisma = require('../../../src/prisma');

describe('Course Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('getCourses', () => {
        it('should get all courses successfully (200)', async () => {
            const mockCourses = [
                { id: 'c1', code: 'CS101', name: 'Intro to CS', deleted_at: null },
                { id: 'c2', code: 'CS102', name: 'Data Structures', deleted_at: null }
            ];
            prisma.courses.findMany.mockResolvedValue(mockCourses);

            await courseController.getCourses(req, res, next);

            expect(prisma.courses.findMany).toHaveBeenCalledWith({
                where: { deleted_at: null },
                orderBy: { name: 'asc' }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockCourses
            });
        });

        it('should call next with error on database failure', async () => {
            const error = new Error('DB Error');
            prisma.courses.findMany.mockRejectedValue(error);

            await courseController.getCourses(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getCourseById', () => {
        it('should get course by id successfully (200)', async () => {
            req.params.id = 'c1';
            const mockCourse = { id: 'c1', code: 'CS101', name: 'Intro to CS', deleted_at: null };
            prisma.courses.findUnique.mockResolvedValue(mockCourse);

            await courseController.getCourseById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockCourse
            });
        });

        it('should return 404 if course not found', async () => {
            req.params.id = 'c1';
            prisma.courses.findUnique.mockResolvedValue(null);

            await courseController.getCourseById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Course not found'
            });
        });

        it('should return 404 if course is soft deleted', async () => {
            req.params.id = 'c1';
            prisma.courses.findUnique.mockResolvedValue({
                id: 'c1',
                deleted_at: new Date()
            });

            await courseController.getCourseById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should call next with error on database failure', async () => {
            req.params.id = 'c1';
            const error = new Error('DB Error');
            prisma.courses.findUnique.mockRejectedValue(error);

            await courseController.getCourseById(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('createCourse', () => {
        it('should create course successfully (201)', async () => {
            req.body = {
                code: 'CS101',
                name: 'Intro to CS',
                description: 'Test course',
                credits: 3,
                department_id: 'dept1',
                semester: 1,
                year: 2025
            };
            const mockCourse = { id: 'c1', ...req.body };
            prisma.courses.create.mockResolvedValue(mockCourse);

            await courseController.createCourse(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockCourse
            });
        });

        it('should call next with error on creation failure', async () => {
            req.body = { code: 'CS101' };
            const error = new Error('Creation failed');
            prisma.courses.create.mockRejectedValue(error);

            await courseController.createCourse(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('updateCourse', () => {
        it('should update course successfully (200)', async () => {
            req.params.id = 'c1';
            req.body = {
                code: 'CS101',
                name: 'Updated Course',
                credits: 4
            };
            const mockCourse = { id: 'c1', ...req.body };
            prisma.courses.update.mockResolvedValue(mockCourse);

            await courseController.updateCourse(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockCourse
            });
        });

        it('should call next with error on update failure', async () => {
            req.params.id = 'c1';
            req.body = { name: 'Updated' };
            const error = new Error('Update failed');
            prisma.courses.update.mockRejectedValue(error);

            await courseController.updateCourse(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('deleteCourse', () => {
        it('should soft delete course successfully (200)', async () => {
            req.params.id = 'c1';
            prisma.courses.update.mockResolvedValue({ id: 'c1', deleted_at: new Date() });

            await courseController.deleteCourse(req, res, next);

            expect(prisma.courses.update).toHaveBeenCalledWith({
                where: { id: 'c1' },
                data: { deleted_at: expect.any(Date) }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Course soft deleted'
            });
        });

        it('should call next with error on deletion failure', async () => {
            req.params.id = 'c1';
            const error = new Error('Deletion failed');
            prisma.courses.update.mockRejectedValue(error);

            await courseController.deleteCourse(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});