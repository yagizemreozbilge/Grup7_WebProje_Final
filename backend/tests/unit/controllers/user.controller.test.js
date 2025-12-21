
jest.mock('../../../src/services/userService');
jest.mock('../../../src/prisma', () => ({
    student: { findUnique: jest.fn() },
    enrollments: { findMany: jest.fn() }
}));
jest.mock('pdfkit', () => jest.fn().mockImplementation(() => ({
    pipe: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    end: jest.fn()
})));

const userController = require('../../../src/controllers/userController');
const userService = require('../../../src/services/userService');
const prisma = require('../../../src/prisma');

describe('User Controller Unit Tests', () => {
    let req, res, next;
    beforeEach(() => {
        jest.clearAllMocks();
        req = { user: { id: 'u1' }, body: {}, params: {}, query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    it('getCurrentUser success', async () => {
        const mockUser = { id: 'u1' };
        userService.getCurrentUser.mockResolvedValue(mockUser);
        await userController.getCurrentUser(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUser });
    });

    it('updateProfile success', async () => {
        userService.updateProfile.mockResolvedValue({ id: 'u1' });
        await userController.updateProfile(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('downloadTranscript success', async () => {
        prisma.student.findUnique.mockResolvedValue({ id: 's1', user: { fullName: 'A' } });
        prisma.enrollments.findMany.mockResolvedValue([{ course_sections: { courses: { name: 'C' } }, grade: 'A' }]);
        await userController.downloadTranscript(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
