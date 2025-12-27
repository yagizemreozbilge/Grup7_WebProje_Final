// ============================================================================
// NOTIFICATIONS CONTROLLER TESTS
// ============================================================================
jest.mock('../../../src/services/NotificationService');
jest.mock('../../../src/services/socketService');
jest.mock('../../../src/prisma', () => ({
    notification: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
    },
    notificationPreference: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
    },
    user: {
        findUnique: jest.fn()
    }
}));

const notificationsController = require('../../../src/controllers/notificationsController');
const NotificationService = require('../../../src/services/NotificationService');
const socketService = require('../../../src/services/socketService');
const prisma = require('../../../src/prisma');

describe('Notifications Controller Unit Tests', () => {
    let req, res, next;

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
        next = jest.fn();
    });

    describe('getNotifications', () => {
        it('should get notifications successfully (200)', async () => {
            const mockNotifications = [
                {
                    id: 'notif1',
                    userId: 'user123',
                    category: 'academic',
                    title: 'Test',
                    message: 'Test message',
                    isRead: false
                }
            ];

            prisma.notification.findMany.mockResolvedValue(mockNotifications);
            prisma.notification.count.mockResolvedValue(1);

            await notificationsController.getNotifications(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockNotifications,
                pagination: expect.objectContaining({
                    page: 1,
                    limit: 20,
                    total: 1,
                    pages: 1
                })
            });
        });

        it('should filter by category', async () => {
            req.query = { category: 'academic' };
            prisma.notification.findMany.mockResolvedValue([]);
            prisma.notification.count.mockResolvedValue(0);

            await notificationsController.getNotifications(req, res, next);

            expect(prisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: 'user123',
                        category: 'academic'
                    })
                })
            );
        });

        it('should filter by isRead', async () => {
            req.query = { isRead: 'true' };
            prisma.notification.findMany.mockResolvedValue([]);
            prisma.notification.count.mockResolvedValue(0);

            await notificationsController.getNotifications(req, res, next);

            expect(prisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: 'user123',
                        isRead: true
                    })
                })
            );
        });

        it('should handle pagination', async () => {
            req.query = { page: '2', limit: '10' };
            prisma.notification.findMany.mockResolvedValue([]);
            prisma.notification.count.mockResolvedValue(0);

            await notificationsController.getNotifications(req, res, next);

            expect(prisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 10
                })
            );
        });

        it('should handle database error', async () => {
            const error = new Error('DB Error');
            prisma.notification.findMany.mockRejectedValue(error);

            await notificationsController.getNotifications(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read successfully (200)', async () => {
            req.params = { id: 'notif1' };
            const mockNotification = {
                id: 'notif1',
                userId: 'user123',
                isRead: false
            };
            const mockUpdated = { ...mockNotification, isRead: true, readAt: new Date() };

            prisma.notification.findUnique.mockResolvedValue(mockNotification);
            prisma.notification.update.mockResolvedValue(mockUpdated);

            await notificationsController.markAsRead(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockUpdated
            });
        });

        it('should return 404 if notification not found', async () => {
            req.params = { id: 'notif1' };
            prisma.notification.findUnique.mockResolvedValue(null);

            await notificationsController.markAsRead(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Notification not found'
            });
        });

        it('should return 403 if unauthorized', async () => {
            req.params = { id: 'notif1' };
            const mockNotification = {
                id: 'notif1',
                userId: 'otheruser',
                isRead: false
            };

            prisma.notification.findUnique.mockResolvedValue(mockNotification);

            await notificationsController.markAsRead(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Unauthorized'
            });
        });

        it('should handle database error', async () => {
            req.params = { id: 'notif1' };
            const error = new Error('DB Error');
            prisma.notification.findUnique.mockRejectedValue(error);

            await notificationsController.markAsRead(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read successfully (200)', async () => {
            prisma.notification.updateMany.mockResolvedValue({ count: 5 });

            await notificationsController.markAllAsRead(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'All notifications marked as read'
            });
        });

        it('should handle database error', async () => {
            const error = new Error('DB Error');
            prisma.notification.updateMany.mockRejectedValue(error);

            await notificationsController.markAllAsRead(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('deleteNotification', () => {
        it('should delete notification successfully (200)', async () => {
            req.params = { id: 'notif1' };
            const mockNotification = {
                id: 'notif1',
                userId: 'user123'
            };

            prisma.notification.findUnique.mockResolvedValue(mockNotification);
            prisma.notification.delete.mockResolvedValue(mockNotification);

            await notificationsController.deleteNotification(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Notification deleted successfully'
            });
        });

        it('should return 404 if notification not found', async () => {
            req.params = { id: 'notif1' };
            prisma.notification.findUnique.mockResolvedValue(null);

            await notificationsController.deleteNotification(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Notification not found'
            });
        });

        it('should return 403 if unauthorized', async () => {
            req.params = { id: 'notif1' };
            const mockNotification = {
                id: 'notif1',
                userId: 'otheruser'
            };

            prisma.notification.findUnique.mockResolvedValue(mockNotification);

            await notificationsController.deleteNotification(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Unauthorized'
            });
        });

        it('should handle database error', async () => {
            req.params = { id: 'notif1' };
            const error = new Error('DB Error');
            prisma.notification.findUnique.mockRejectedValue(error);

            await notificationsController.deleteNotification(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getPreferences', () => {
        it('should get preferences successfully (200)', async () => {
            const mockPreferences = {
                userId: 'user123',
                preferences: {
                    email: { academic: true },
                    push: { academic: true }
                }
            };

            prisma.notificationPreference.findUnique.mockResolvedValue(mockPreferences);

            await notificationsController.getPreferences(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockPreferences.preferences
            });
        });

        it('should create default preferences if not exists', async () => {
            const mockDefaultPrefs = {
                userId: 'user123',
                preferences: {
                    email: { academic: true },
                    push: { academic: true }
                }
            };

            prisma.notificationPreference.findUnique.mockResolvedValue(null);
            prisma.notificationPreference.create.mockResolvedValue(mockDefaultPrefs);

            await notificationsController.getPreferences(req, res, next);

            expect(prisma.notificationPreference.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle database error', async () => {
            const error = new Error('DB Error');
            prisma.notificationPreference.findUnique.mockRejectedValue(error);

            await notificationsController.getPreferences(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('updatePreferences', () => {
        it('should update preferences successfully (200)', async () => {
            req.body = {
                preferences: {
                    email: { academic: true },
                    push: { academic: false }
                }
            };

            const mockUpdated = {
                userId: 'user123',
                preferences: req.body.preferences
            };

            prisma.notificationPreference.findUnique.mockResolvedValue(null);
            prisma.notificationPreference.create.mockResolvedValue(mockUpdated);

            await notificationsController.updatePreferences(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockUpdated.preferences
            });
        });

        it('should return 400 for invalid preferences format', async () => {
            req.body = { preferences: 'invalid' };

            await notificationsController.updatePreferences(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid preferences format'
            });
        });

        it('should return 400 for invalid preference value', async () => {
            req.body = {
                preferences: {
                    email: { academic: 'invalid' }
                }
            };

            await notificationsController.updatePreferences(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid preference value for email.academic'
            });
        });

        it('should handle database error', async () => {
            req.body = {
                preferences: {
                    email: { academic: true }
                }
            };
            const error = new Error('DB Error');
            prisma.notificationPreference.findUnique.mockRejectedValue(error);

            await notificationsController.updatePreferences(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('createNotification', () => {
        it('should create notification successfully', async () => {
            const mockNotification = {
                id: 'notif1',
                userId: 'user123',
                category: 'academic',
                title: 'Test',
                message: 'Test message',
                isRead: false,
                createdAt: new Date()
            };
            const mockUser = {
                id: 'user123',
                email: 'test@example.com',
                phone: '1234567890'
            };
            const mockPreference = {
                preferences: {
                    email: { academic: true },
                    push: { academic: true },
                    sms: { attendance: true }
                }
            };

            prisma.notification.create.mockResolvedValue(mockNotification);
            prisma.notificationPreference.findUnique.mockResolvedValue(mockPreference);
            prisma.user.findUnique.mockResolvedValue(mockUser);
            NotificationService.sendEmail.mockResolvedValue();
            NotificationService.sendPushNotification.mockResolvedValue();
            NotificationService.sendSMS.mockResolvedValue();
            socketService.sendNotificationToUser.mockResolvedValue();

            const result = await notificationsController.createNotification(
                'user123',
                'academic',
                'Test',
                'Test message'
            );

            expect(result).toEqual(mockNotification);
            expect(NotificationService.sendEmail).toHaveBeenCalled();
            expect(NotificationService.sendPushNotification).toHaveBeenCalled();
            expect(socketService.sendNotificationToUser).toHaveBeenCalled();
        });

        it('should use default preferences if not found', async () => {
            const mockNotification = {
                id: 'notif1',
                userId: 'user123',
                category: 'academic',
                title: 'Test',
                message: 'Test message',
                isRead: false,
                createdAt: new Date()
            };
            const mockUser = {
                id: 'user123',
                email: 'test@example.com'
            };

            prisma.notification.create.mockResolvedValue(mockNotification);
            prisma.notificationPreference.findUnique.mockResolvedValue(null);
            prisma.user.findUnique.mockResolvedValue(mockUser);
            NotificationService.sendEmail.mockResolvedValue();
            NotificationService.sendPushNotification.mockResolvedValue();
            socketService.sendNotificationToUser.mockResolvedValue();

            const result = await notificationsController.createNotification(
                'user123',
                'academic',
                'Test',
                'Test message'
            );

            expect(result).toEqual(mockNotification);
        });

        it('should send SMS for critical categories', async () => {
            const mockNotification = {
                id: 'notif1',
                userId: 'user123',
                category: 'attendance',
                title: 'Test',
                message: 'Test message',
                isRead: false,
                createdAt: new Date()
            };
            const mockUser = {
                id: 'user123',
                email: 'test@example.com',
                phone: '1234567890'
            };
            const mockPreference = {
                preferences: {
                    email: { attendance: true },
                    push: { attendance: true },
                    sms: { attendance: true }
                }
            };

            prisma.notification.create.mockResolvedValue(mockNotification);
            prisma.notificationPreference.findUnique.mockResolvedValue(mockPreference);
            prisma.user.findUnique.mockResolvedValue(mockUser);
            NotificationService.sendEmail.mockResolvedValue();
            NotificationService.sendPushNotification.mockResolvedValue();
            NotificationService.sendSMS.mockResolvedValue();
            socketService.sendNotificationToUser.mockResolvedValue();

            await notificationsController.createNotification(
                'user123',
                'attendance',
                'Test',
                'Test message'
            );

            expect(NotificationService.sendSMS).toHaveBeenCalled();
        });

        it('should handle error', async () => {
            const error = new Error('DB Error');
            prisma.notification.create.mockRejectedValue(error);

            await expect(
                notificationsController.createNotification(
                    'user123',
                    'academic',
                    'Test',
                    'Test message'
                )
            ).rejects.toThrow('DB Error');
        });
    });
});

