const prisma = require('../prisma');
const NotificationService = require('../services/NotificationService');

const reservationsController = {
  // Create classroom reservation
  async createReservation(req, res, next) {
    try {
      const userId = req.user.id;
      const { classroom_id, date, start_time, end_time, purpose } = req.body;

      // Check classroom availability
      const existingReservations = await prisma.classroomReservation.findMany({
        where: {
          classroom_id,
          date: new Date(date),
          status: { in: ['pending', 'approved'] }
        }
      });

      // Check for time overlap
      const hasOverlap = existingReservations.some(reservation => {
        return this.timeOverlaps(
          reservation.start_time,
          reservation.end_time,
          start_time,
          end_time
        );
      });

      if (hasOverlap) {
        return res.status(400).json({
          success: false,
          error: 'Classroom is not available at this time'
        });
      }

      // Check user permissions (students may need approval)
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      const needsApproval = user.role === 'student';

      // Create reservation
      const reservation = await prisma.classroomReservation.create({
        data: {
          classroom_id,
          user_id: userId,
          date: new Date(date),
          start_time,
          end_time,
          purpose,
          status: needsApproval ? 'pending' : 'approved'
        },
        include: {
          classroom: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        }
      });

      // Notify admin if needs approval
      if (needsApproval) {
        const admins = await prisma.user.findMany({
          where: { role: 'admin' }
        });

        for (const admin of admins) {
          await NotificationService.sendEmail(
            admin.email,
            'Yeni Derslik Rezervasyon Talebi',
            `${user.fullName} tarafından yeni bir derslik rezervasyon talebi oluşturuldu.`
          );
        }
      }

      res.status(201).json({ success: true, data: reservation });
    } catch (error) {
      next(error);
    }
  },

  // Get available classrooms
  async getClassrooms(req, res, next) {
    try {
      const classrooms = await prisma.classrooms.findMany({
        orderBy: [
          { building: 'asc' },
          { room_number: 'asc' }
        ]
      });

      res.status(200).json({ success: true, data: classrooms });
    } catch (error) {
      next(error);
    }
  },

  // Get reservations
  async getReservations(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { date, classroom_id, status } = req.query;

      const where = {};

      // Students can only see their own reservations
      if (userRole === 'student') {
        where.user_id = userId;
      }

      if (date) {
        where.date = new Date(date);
      }

      if (classroom_id) {
        where.classroom_id = classroom_id;
      }

      if (status) {
        where.status = status;
      }

      const reservations = await prisma.classroomReservation.findMany({
        where,
        include: {
          classroom: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        },
        orderBy: [
          { date: 'asc' },
          { start_time: 'asc' }
        ]
      });

      res.status(200).json({ success: true, data: reservations });
    } catch (error) {
      next(error);
    }
  },

  // Approve reservation (admin only)
  async approveReservation(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const reservation = await prisma.classroomReservation.findUnique({
        where: { id },
        include: {
          user: true
        }
      });

      if (!reservation) {
        return res.status(404).json({ success: false, error: 'Reservation not found' });
      }

      if (reservation.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Reservation is not pending'
        });
      }

      const updatedReservation = await prisma.classroomReservation.update({
        where: { id },
        data: {
          status: 'approved',
          approved_by: adminId
        },
        include: {
          classroom: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        }
      });

      // Send approval notification
      await NotificationService.sendEmail(
        reservation.user.email,
        'Derslik Rezervasyonu Onaylandı',
        `Derslik rezervasyonunuz onaylanmıştır.`
      );

      res.status(200).json({ success: true, data: updatedReservation });
    } catch (error) {
      next(error);
    }
  },

  // Reject reservation (admin only)
  async rejectReservation(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const reservation = await prisma.classroomReservation.findUnique({
        where: { id },
        include: {
          user: true
        }
      });

      if (!reservation) {
        return res.status(404).json({ success: false, error: 'Reservation not found' });
      }

      if (reservation.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Reservation is not pending'
        });
      }

      const updatedReservation = await prisma.classroomReservation.update({
        where: { id },
        data: {
          status: 'rejected',
          approved_by: adminId
        }
      });

      // Send rejection notification
      await NotificationService.sendEmail(
        reservation.user.email,
        'Derslik Rezervasyonu Reddedildi',
        `Derslik rezervasyonunuz reddedilmiştir.${reason ? ` Sebep: ${reason}` : ''}`
      );

      res.status(200).json({ success: true, data: updatedReservation });
    } catch (error) {
      next(error);
    }
  },

  // Helper: Check if two time ranges overlap
  timeOverlaps(start1, end1, start2, end2) {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);

    return (start1Min < end2Min && end1Min > start2Min);
  }
};

module.exports = reservationsController;





