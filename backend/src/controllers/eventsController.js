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
          { startTime: 'asc' }
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
              userId: true,
              checkedIn: true
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
          startTime: start_time,
          endTime: end_time,
          location,
          capacity,
          registeredCount: 0,
          registrationDeadline: new Date(registration_deadline),
          isPaid: is_paid || false,
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

      // Map snake_case to camelCase for Prisma
      const mappedData = {};
      if (updateData.start_time) mappedData.startTime = updateData.start_time;
      if (updateData.end_time) mappedData.endTime = updateData.end_time;
      if (updateData.registration_deadline) mappedData.registrationDeadline = new Date(updateData.registration_deadline);
      if (updateData.is_paid !== undefined) mappedData.isPaid = updateData.is_paid;
      if (updateData.registered_count !== undefined) mappedData.registeredCount = updateData.registered_count;
      
      // Copy other fields
      Object.keys(updateData).forEach(key => {
        if (!['start_time', 'end_time', 'registration_deadline', 'is_paid', 'registered_count'].includes(key)) {
          mappedData[key] = updateData[key];
        }
      });

      if (mappedData.date) {
        mappedData.date = new Date(mappedData.date);
      }

      const event = await prisma.event.update({
        where: { id },
        data: mappedData
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

      // Check capacity - if full, add to waitlist
      if (event.registeredCount >= event.capacity) {
        // Check if already on waitlist
        const existingWaitlist = await prisma.eventWaitlist.findUnique({
          where: {
            eventId_userId: {
              eventId: id,
              userId: userId
            }
          }
        });

        if (existingWaitlist) {
          return res.status(400).json({ 
            success: false, 
            error: 'You are already on the waitlist',
            waitlistPosition: existingWaitlist.position
          });
        }

        // Get current waitlist count for position
        const waitlistCount = await prisma.eventWaitlist.count({
          where: { eventId: id }
        });

        // Add to waitlist
        const waitlistEntry = await prisma.eventWaitlist.create({
          data: {
            eventId: id,
            userId: userId,
            position: waitlistCount + 1
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

        // Send waitlist confirmation
        await NotificationService.sendEmail(
          waitlistEntry.user.email,
          'Etkinlik Bekleme Listesine Eklendiniz',
          `<h2>Bekleme Listesine Eklendiniz</h2>
           <p>${event.title} etkinliği için bekleme listesine eklendiniz.</p>
           <p><strong>Bekleme Listesi Pozisyonunuz:</strong> ${waitlistEntry.position}</p>
           <p>Etkinlikte yer açıldığında size bildirim gönderilecektir.</p>`
        );

        return res.status(200).json({ 
          success: true, 
          data: {
            waitlist: true,
            position: waitlistEntry.position,
            message: 'Event is full. You have been added to the waitlist.'
          }
        });
      }

      // Check registration deadline
      if (new Date() > new Date(event.registrationDeadline)) {
        return res.status(400).json({ success: false, error: 'Registration deadline has passed' });
      }

      // Check if already registered
      const existingRegistration = await prisma.eventRegistration.findFirst({
        where: {
          eventId: id,
          userId: userId
        }
      });

      if (existingRegistration) {
        return res.status(400).json({ success: false, error: 'Already registered for this event' });
      }

      // If paid, check wallet balance
      if (event.isPaid && event.price > 0) {
        const wallet = await prisma.wallet.findUnique({
          where: { userId: userId }
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
            eventId: id,
            userId: userId,
            qrCode: qrCode,
            customFieldsJson: custom_fields || null
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

        // Update registeredCount (atomic)
        await tx.event.update({
          where: { id },
          data: {
            registeredCount: {
              increment: 1
            }
          }
        });

        // If there was a waitlist, notify next person (if any)
        const nextWaitlistEntry = await tx.eventWaitlist.findFirst({
          where: { eventId: id },
          orderBy: { position: 'asc' }
        });

        if (nextWaitlistEntry) {
          // Notify next person in waitlist
          const nextUser = await tx.user.findUnique({
            where: { id: nextWaitlistEntry.userId }
          });

          if (nextUser) {
            await NotificationService.sendEmail(
              nextUser.email,
              'Etkinlikte Yer Açıldı',
              `<h2>Etkinlikte Yer Açıldı</h2>
               <p>${event.title} etkinliğinde yer açıldı. Hemen kayıt olabilirsiniz!</p>
               <p>Kayıt olmak için etkinlik sayfasını ziyaret edin.</p>`
            );

            // Update notifiedAt
            await tx.eventWaitlist.update({
              where: { id: nextWaitlistEntry.id },
              data: { notifiedAt: new Date() }
            });
          }
        }

        // If paid, deduct from wallet
        if (event.isPaid && event.price > 0) {
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

      if (registration.userId !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      if (registration.checkedIn) {
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

      // Update registeredCount
      await tx.event.update({
        where: { id: eventId },
        data: {
          registeredCount: {
            decrement: 1
          }
        }
      });

      // If event now has space, promote first person from waitlist
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (event && event.registeredCount < event.capacity) {
        const firstWaitlist = await tx.eventWaitlist.findFirst({
          where: { eventId: eventId },
          orderBy: { position: 'asc' }
        });

        if (firstWaitlist) {
          // Notify first person in waitlist
          const waitlistUser = await tx.user.findUnique({
            where: { id: firstWaitlist.userId }
          });

          if (waitlistUser) {
            await NotificationService.sendEmail(
              waitlistUser.email,
              'Etkinlikte Yer Açıldı',
              `<h2>Etkinlikte Yer Açıldı</h2>
               <p>${event.title} etkinliğinde yer açıldı. Hemen kayıt olabilirsiniz!</p>
               <p>Kayıt olmak için etkinlik sayfasını ziyaret edin.</p>`
            );

            await tx.eventWaitlist.update({
              where: { id: firstWaitlist.id },
              data: { notifiedAt: new Date() }
            });
          }
        }
      }

        // If paid, refund
        if (registration.event.isPaid && registration.event.price > 0) {
          const wallet = await prisma.wallet.findUnique({
            where: { userId: userId }
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
          `Etkinlik kaydınız iptal edilmiştir.${registration.event.isPaid ? ' Ücret cüzdanınıza iade edilmiştir.' : ''}`
        );
      }

      res.status(200).json({ success: true, message: 'Registration cancelled successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Get waitlist for an event
  async getWaitlist(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const event = await prisma.event.findUnique({
        where: { id }
      });

      if (!event) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      // Check if user is on waitlist
      const userWaitlist = await prisma.eventWaitlist.findUnique({
        where: {
          eventId_userId: {
            eventId: id,
            userId: userId
          }
        }
      });

      // Get all waitlist entries
      const waitlist = await prisma.eventWaitlist.findMany({
        where: { eventId: id },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { position: 'asc' }
      });

      res.status(200).json({
        success: true,
        data: {
          waitlist,
          userPosition: userWaitlist ? userWaitlist.position : null,
          totalOnWaitlist: waitlist.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Remove from waitlist
  async removeFromWaitlist(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const waitlistEntry = await prisma.eventWaitlist.findUnique({
        where: {
          eventId_userId: {
            eventId: id,
            userId: userId
          }
        }
      });

      if (!waitlistEntry) {
        return res.status(404).json({ success: false, error: 'Not on waitlist' });
      }

      const removedPosition = waitlistEntry.position;

      // Remove from waitlist and update positions
      await prisma.$transaction(async (tx) => {
        await tx.eventWaitlist.delete({
          where: { id: waitlistEntry.id }
        });

        // Update positions of remaining entries
        await tx.eventWaitlist.updateMany({
          where: {
            eventId: id,
            position: { gt: removedPosition }
          },
          data: {
            position: { decrement: 1 }
          }
        });
      });

      res.status(200).json({ success: true, message: 'Removed from waitlist' });
    } catch (error) {
      next(error);
    }
  },

  // Get current user's event registrations
  async getMyRegistrations(req, res, next) {
    try {
      const userId = req.user.id;
      console.log('🔍 [getMyRegistrations] User ID:', userId);

      const registrations = await prisma.eventRegistration.findMany({
        where: { userId: userId },
        include: {
          event: true
        },
        orderBy: { registrationDate: 'desc' }
      });

      console.log('✅ [getMyRegistrations] Found registrations:', registrations.length);
      console.log('📋 [getMyRegistrations] Registrations:', JSON.stringify(registrations, null, 2));

      res.status(200).json({ success: true, data: registrations });
    } catch (error) {
      console.error('❌ [getMyRegistrations] Error:', error);
      next(error);
    }
  },

  // Get event registrations (admin only)
  async getEventRegistrations(req, res, next) {
    try {
      const { id } = req.params;

      const registrations = await prisma.eventRegistration.findMany({
        where: { eventId: id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        },
        orderBy: { registrationDate: 'desc' }
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
      const { qrCode } = req.body;

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

      if (registration.eventId !== eventId) {
        return res.status(400).json({ success: false, error: 'Registration does not match event' });
      }

      // Validate QR code
      if (registration.qrCode !== qrCode) {
        return res.status(400).json({ success: false, error: 'Invalid QR code' });
      }

      if (registration.checkedIn) {
        return res.status(400).json({
          success: false,
          error: 'Already checked in'
        });
      }

      // Mark as checked in
      const updatedRegistration = await prisma.eventRegistration.update({
        where: { id: regId },
        data: {
          checkedIn: true,
          checkedInAt: new Date()
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





