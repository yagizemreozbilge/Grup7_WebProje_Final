const prisma = require('../prisma');
const NotificationService = require('../services/NotificationService');
const socketService = require('../services/socketService');

const notificationsController = {
  // GET /api/v1/notifications - Get notifications list with pagination
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, category, isRead, sort = 'desc' } = req.query;

      const where = {
        userId
      };

      if (category) {
        where.category = category;
      }

      if (isRead !== undefined) {
        where.isRead = isRead === 'true';
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: {
            createdAt: sort === 'asc' ? 'asc' : 'desc'
          },
          skip,
          take
        }),
        prisma.notification.count({ where })
      ]);

      res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/v1/notifications/:id/read - Mark notification as read
  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const notification = await prisma.notification.findUnique({
        where: { id }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/v1/notifications/mark-all-read - Mark all notifications as read
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;

      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/v1/notifications/:id - Delete notification
  async deleteNotification(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const notification = await prisma.notification.findUnique({
        where: { id }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      await prisma.notification.delete({
        where: { id }
      });

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/notifications/preferences - Get notification preferences
  async getPreferences(req, res, next) {
    try {
      const userId = req.user.id;

      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId }
      });

      // Create default preferences if not exists
      if (!preferences) {
        const defaultPreferences = {
          email: {
            academic: true,
            attendance: true,
            meal: false,
            event: true,
            payment: true,
            system: true
          },
          push: {
            academic: true,
            attendance: true,
            meal: true,
            event: true,
            payment: true,
            system: false
          },
          sms: {
            attendance: true,
            payment: false
          }
        };

        preferences = await prisma.notificationPreference.create({
          data: {
            userId,
            preferences: defaultPreferences
          }
        });
      }

      res.status(200).json({
        success: true,
        data: preferences.preferences
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/v1/notifications/preferences - Update notification preferences
  async updatePreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const { preferences } = req.body;

      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid preferences format'
        });
      }

      // Validate preferences structure
      const validCategories = ['academic', 'attendance', 'meal', 'event', 'payment', 'system'];
      const validChannels = ['email', 'push', 'sms'];

      for (const channel of validChannels) {
        if (preferences[channel]) {
          for (const category of validCategories) {
            if (preferences[channel][category] !== undefined) {
              if (typeof preferences[channel][category] !== 'boolean') {
                return res.status(400).json({
                  success: false,
                  error: `Invalid preference value for ${channel}.${category}`
                });
              }
            }
          }
        }
      }

      let notificationPreference = await prisma.notificationPreference.findUnique({
        where: { userId }
      });

      if (notificationPreference) {
        notificationPreference = await prisma.notificationPreference.update({
          where: { userId },
          data: {
            preferences
          }
        });
      } else {
        notificationPreference = await prisma.notificationPreference.create({
          data: {
            userId,
            preferences
          }
        });
      }

      res.status(200).json({
        success: true,
        data: notificationPreference.preferences
      });
    } catch (error) {
      next(error);
    }
  }
};

// Helper method to create notification (exported separately)
notificationsController.createNotification = async function(userId, category, title, message, data = null) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          category,
          title,
          message,
          data
        }
      });

      // Get user preferences
      const preference = await prisma.notificationPreference.findUnique({
        where: { userId }
      });

      const prefs = preference?.preferences || {
        email: {
          academic: true,
          attendance: true,
          meal: false,
          event: true,
          payment: true,
          system: true
        },
        push: {
          academic: true,
          attendance: true,
          meal: true,
          event: true,
          payment: true,
          system: false
        },
        sms: {
          attendance: true,
          payment: false
        }
      };

      // Send notifications based on preferences
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (user) {
        // Email notification
        if (prefs.email?.[category]) {
          await NotificationService.sendEmail(
            user.email,
            title,
            `<h2>${title}</h2><p>${message}</p>`,
            `${title}\n\n${message}`
          );
        }

        // Push notification
        if (prefs.push?.[category]) {
          await NotificationService.sendPushNotification(
            userId,
            title,
            message,
            data
          );
        }

        // SMS notification (only for critical categories)
        if (prefs.sms?.[category] && ['attendance', 'payment'].includes(category)) {
          if (user.phone) {
            await NotificationService.sendSMS(user.phone, `${title}: ${message}`);
          }
        }

        // Real-time WebSocket notification
        socketService.sendNotificationToUser(userId, {
          id: notification.id,
          category: notification.category,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
};

module.exports = notificationsController;

