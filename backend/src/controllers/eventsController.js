const prisma = require('../prisma');
const QRCodeService = require('../services/QRCodeService');
const PaymentService = require('../services/PaymentService');
const NotificationService = require('../services/NotificationService');

const eventsController = {
  // Get events with filters
  async getEvents(req, res, next) {
    try {
      const { category, date, status } = req.query;

      const where = {};

      if (category) {
        where.category = category;
      }

      if (date) {
        where.date = new Date(date);
      }

      if (status) {
        where.status = status;
      } else {
        where.status = 'published';
      }

      const events = await prisma.event.findMany({
        where,
        orderBy: [
          { date: 'asc' },
          { start_time: 'asc' }
        ]
      });

      res.status(200).json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  },

  // Get event by ID
  async getEventById(req, res, next) {
    try {
      const { id } = req.params;

      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          registrations: {
            select: {
              id: true,
              user_id: true,
              checked_in: true
            }
          }
        }
      });

      if (!event) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      res.status(200).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  },

  // Create event (admin only)
  async createEvent(req, res, next) {
    try {
      const {
        title,
        description,
        category,
        date,
        start_time,
        end_time,
        location,
        capacity,
        registration_deadline,
        is_paid,
        price,
        status
      } = req.body;

      const event = await prisma.event.create({
        data: {
          title,
          description,
          category,
          date: new Date(date),
          start_time,
          end_time,
          location,
          capacity,
          registered_count: 0,
          registration_deadline: new Date(registration_deadline),
          is_paid: is_paid || false,
          price: is_paid ? price : null,
          status: status || 'draft'
        }
      });

      res.status(201).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  },

  // Update event (admin only)
  async updateEvent(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      if (updateData.registration_deadline) {
        updateData.registration_deadline = new Date(updateData.registration_deadline);
      }

      const event = await prisma.event.update({
        where: { id },
        data: updateData
      });

      res.status(200).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  },

  // Delete event (admin only)
  async deleteEvent(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.event.delete({
        where: { id }
      });

      res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Register for event
  async registerForEvent(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { custom_fields } = req.body;

      const event = await prisma.event.findUnique({
        where: { id }
      });

      if (!event) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      if (event.status !== 'published') {
        return res.status(400).json({ success: false, error: 'Event is not published' });
      }

      // Check capacity
      if (event.registered_count >= event.capacity) {
        return res.status(400).json({ success: false, error: 'Event is full' });
      }

      // Check registration deadline
      if (new Date() > new Date(event.registration_deadline)) {
        return res.status(400).json({ success: false, error: 'Registration deadline has passed' });
      }

      // Check if already registered
      const existingRegistration = await prisma.eventRegistration.findFirst({
        where: {
          event_id: id,
          user_id: userId
        }
      });

      if (existingRegistration) {
        return res.status(400).json({ success: false, error: 'Already registered for this event' });
      }

      // If paid, check wallet balance
      if (event.is_paid && event.price > 0) {
        const wallet = await prisma.wallet.findUnique({
          where: { user_id: userId }
        });

        if (!wallet || wallet.balance < event.price) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient balance'
          });
        }
      }

      // Generate QR code
      const qrCode = QRCodeService.generateEventQRCode();

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Create registration
        const registration = await tx.eventRegistration.create({
          data: {
            event_id: id,
            user_id: userId,
            qr_code: qrCode,
            custom_fields_json: custom_fields || null
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true
              }
            }
          }
        });

        // Update registered_count (atomic)
        await tx.event.update({
          where: { id },
          data: {
            registered_count: {
              increment: 1
            }
          }
        });

        // If paid, deduct from wallet
        if (event.is_paid && event.price > 0) {
          const wallet = await prisma.wallet.findUnique({
            where: { user_id: userId }
          });

          if (wallet) {
            await PaymentService.deductFromWallet(
              wallet.id,
              event.price,
              'event_registration',
              registration.id,
              `Event registration - ${event.title}`
            );
          }
        }

        return registration;
      });

      // Send confirmation email
      await NotificationService.sendEventRegistrationConfirmation(
        result.user.email,
        event,
        result
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Cancel registration
  async cancelRegistration(req, res, next) {
    try {
      const userId = req.user.id;
      const { eventId, regId } = req.params;

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: regId },
        include: {
          event: true
        }
      });

      if (!registration) {
        return res.status(404).json({ success: false, error: 'Registration not found' });
      }

      if (registration.user_id !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      if (registration.checked_in) {
        return res.status(400).json({
          success: false,
          error: 'Cannot cancel checked-in registration'
        });
      }

      // Use transaction
      await prisma.$transaction(async (tx) => {
        // Delete registration
        await tx.eventRegistration.delete({
          where: { id: regId }
        });

        // Update registered_count
        await tx.event.update({
          where: { id: eventId },
          data: {
            registered_count: {
              decrement: 1
            }
          }
        });

        // If paid, refund
        if (registration.event.is_paid && registration.event.price > 0) {
          const wallet = await prisma.wallet.findUnique({
            where: { user_id: userId }
          });

          if (wallet) {
            await PaymentService.refundToWallet(
              wallet.id,
              registration.event.price,
              'refund',
              registration.id,
              `Refund for cancelled event registration`
            );
          }
        }
      });

      // Send cancellation email
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (user) {
        await NotificationService.sendEmail(
          user.email,
          'Etkinlik Kaydı İptal Edildi',
          `Etkinlik kaydınız iptal edilmiştir.${registration.event.is_paid ? ' Ücret cüzdanınıza iade edilmiştir.' : ''}`
        );
      }

      res.status(200).json({ success: true, message: 'Registration cancelled successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Get event registrations (admin only)
  async getEventRegistrations(req, res, next) {
    try {
      const { id } = req.params;

      const registrations = await prisma.eventRegistration.findMany({
        where: { event_id: id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        },
        orderBy: { registration_date: 'desc' }
      });

      res.status(200).json({ success: true, data: registrations });
    } catch (error) {
      next(error);
    }
  },

  // Check in (admin only)
  async checkIn(req, res, next) {
    try {
      const { eventId, regId } = req.params;
      const { qr_code } = req.body;

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: regId },
        include: {
          event: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        }
      });

      if (!registration) {
        return res.status(404).json({ success: false, error: 'Registration not found' });
      }

      if (registration.event_id !== eventId) {
        return res.status(400).json({ success: false, error: 'Registration does not match event' });
      }

      // Validate QR code
      if (registration.qr_code !== qr_code) {
        return res.status(400).json({ success: false, error: 'Invalid QR code' });
      }

      if (registration.checked_in) {
        return res.status(400).json({
          success: false,
          error: 'Already checked in'
        });
      }

      // Mark as checked in
      const updatedRegistration = await prisma.eventRegistration.update({
        where: { id: regId },
        data: {
          checked_in: true,
          checked_in_at: new Date()
        }
      });

      res.status(200).json({
        success: true,
        data: {
          registration: updatedRegistration,
          user: registration.user
        },
        message: 'Check-in successful'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = eventsController;

