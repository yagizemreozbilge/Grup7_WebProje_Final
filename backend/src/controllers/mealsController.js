const prisma = require('../prisma');
const QRCodeService = require('../services/QRCodeService');
const PaymentService = require('../services/PaymentService');
const NotificationService = require('../services/NotificationService');

const mealsController = {
  // Get menus with optional date filter
  async getMenus(req, res, next) {
    try {
      const { date, cafeteria_id, meal_type } = req.query;
      
      const where = {
        is_published: true
      };

      if (date) {
        where.date = new Date(date);
      }

      if (cafeteria_id) {
        where.cafeteria_id = cafeteria_id;
      }

      if (meal_type) {
        where.meal_type = meal_type;
      }

      const menus = await prisma.mealMenu.findMany({
        where,
        include: {
          cafeteria: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        },
        orderBy: [
          { date: 'asc' },
          { meal_type: 'asc' }
        ]
      });

      res.status(200).json({ success: true, data: menus });
    } catch (error) {
      next(error);
    }
  },

  // Get menu by ID
  async getMenuById(req, res, next) {
    try {
      const { id } = req.params;

      const menu = await prisma.mealMenu.findUnique({
        where: { id },
        include: {
          cafeteria: true
        }
      });

      if (!menu) {
        return res.status(404).json({ success: false, error: 'Menu not found' });
      }

      res.status(200).json({ success: true, data: menu });
    } catch (error) {
      next(error);
    }
  },

  // Create menu (admin only)
  async createMenu(req, res, next) {
    try {
      const { cafeteria_id, date, meal_type, items_json, nutrition_json, is_published } = req.body;

      const menu = await prisma.mealMenu.create({
        data: {
          cafeteria_id,
          date: new Date(date),
          meal_type,
          items_json,
          nutrition_json,
          is_published: is_published || false
        },
        include: {
          cafeteria: true
        }
      });

      res.status(201).json({ success: true, data: menu });
    } catch (error) {
      next(error);
    }
  },

  // Update menu (admin only)
  async updateMenu(req, res, next) {
    try {
      const { id } = req.params;
      const { date, meal_type, items_json, nutrition_json, is_published } = req.body;

      const menu = await prisma.mealMenu.update({
        where: { id },
        data: {
          ...(date && { date: new Date(date) }),
          ...(meal_type && { meal_type }),
          ...(items_json && { items_json }),
          ...(nutrition_json && { nutrition_json }),
          ...(is_published !== undefined && { is_published })
        },
        include: {
          cafeteria: true
        }
      });

      res.status(200).json({ success: true, data: menu });
    } catch (error) {
      next(error);
    }
  },

  // Delete menu (admin only)
  async deleteMenu(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.mealMenu.delete({
        where: { id }
      });

      res.status(200).json({ success: true, message: 'Menu deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Create reservation
  async createReservation(req, res, next) {
    try {
      const userId = req.user.id;
      const { menu_id, cafeteria_id, meal_type, date, amount } = req.body;

      // Get user and check if student (for scholarship check)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          student: true
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Get menu
      const menu = await prisma.mealMenu.findUnique({
        where: { id: menu_id }
      });

      if (!menu) {
        return res.status(404).json({ success: false, error: 'Menu not found' });
      }

      const isStudent = user.role === 'student';
      const isScholarship = isStudent && user.student; // TODO: Add scholarship field to student model

      // Check daily quota for scholarship students (max 2 meals/day)
      if (isScholarship) {
        const today = new Date(date);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayReservations = await prisma.mealReservation.count({
          where: {
            user_id: userId,
            date: {
              gte: today,
              lt: tomorrow
            },
            status: { in: ['reserved', 'used'] }
          }
        });

        if (todayReservations >= 2) {
          return res.status(400).json({
            success: false,
            error: 'Daily quota exceeded. Maximum 2 meals per day for scholarship students.'
          });
        }
      }

      // If paid, check wallet balance
      if (!isScholarship && amount > 0) {
        const wallet = await prisma.wallet.findUnique({
          where: { user_id: userId }
        });

        if (!wallet) {
          return res.status(400).json({ success: false, error: 'Wallet not found' });
        }

        if (wallet.balance < amount) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient balance'
          });
        }
      }

      // Generate QR code
      const qrCode = QRCodeService.generateMealQRCode();

      // Create reservation
      const reservation = await prisma.mealReservation.create({
        data: {
          user_id: userId,
          menu_id,
          cafeteria_id,
          meal_type,
          date: new Date(date),
          amount: isScholarship ? 0 : amount,
          qr_code: qrCode,
          status: 'reserved'
        },
        include: {
          menu: {
            include: {
              cafeteria: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        }
      });

      // If paid, create pending transaction (will deduct on use)
      if (!isScholarship && amount > 0) {
        const wallet = await prisma.wallet.findUnique({
          where: { user_id: userId }
        });

        await prisma.transaction.create({
          data: {
            wallet_id: wallet.id,
            type: 'debit',
            amount,
            balance_after: wallet.balance, // Will update when used
            reference_type: 'meal_reservation',
            reference_id: reservation.id,
            description: `Meal reservation - ${meal_type}`
          }
        });
      }

      // Send confirmation notification
      await NotificationService.sendMealReservationConfirmation(user.email, reservation);

      res.status(201).json({ success: true, data: reservation });
    } catch (error) {
      next(error);
    }
  },

  // Cancel reservation
  async cancelReservation(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const reservation = await prisma.mealReservation.findUnique({
        where: { id },
        include: {
          menu: true,
          user: true
        }
      });

      if (!reservation) {
        return res.status(404).json({ success: false, error: 'Reservation not found' });
      }

      if (reservation.user_id !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      if (reservation.status !== 'reserved') {
        return res.status(400).json({
          success: false,
          error: 'Only reserved reservations can be cancelled'
        });
      }

      // Check if >= 2 hours before meal time
      const mealDate = new Date(reservation.date);
      const mealTime = reservation.meal_type === 'lunch' ? 12 : reservation.meal_type === 'dinner' ? 18 : 8;
      mealDate.setHours(mealTime, 0, 0, 0);

      const now = new Date();
      const hoursUntilMeal = (mealDate - now) / (1000 * 60 * 60);

      if (hoursUntilMeal < 2) {
        return res.status(400).json({
          success: false,
          error: 'Reservations can only be cancelled at least 2 hours before meal time'
        });
      }

      // If paid, refund to wallet
      if (reservation.amount > 0) {
        const wallet = await prisma.wallet.findUnique({
          where: { user_id: userId }
        });

        if (wallet) {
          await PaymentService.refundToWallet(
            wallet.id,
            reservation.amount,
            'refund',
            reservation.id,
            `Refund for cancelled meal reservation`
          );
        }
      }

      // Update reservation status
      await prisma.mealReservation.update({
        where: { id },
        data: {
          status: 'cancelled'
        }
      });

      // Send notification
      await NotificationService.sendEmail(
        reservation.user.email,
        'Yemek Rezervasyonu İptal Edildi',
        `Yemek rezervasyonunuz iptal edilmiştir.${reservation.amount > 0 ? ' Ücret cüzdanınıza iade edilmiştir.' : ''}`
      );

      res.status(200).json({ success: true, message: 'Reservation cancelled successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Get my reservations
  async getMyReservations(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, date } = req.query;

      const where = { user_id: userId };

      if (status) {
        where.status = status;
      }

      if (date) {
        where.date = new Date(date);
      }

      const reservations = await prisma.mealReservation.findMany({
        where,
        include: {
          menu: {
            include: {
              cafeteria: true
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { created_at: 'desc' }
        ]
      });

      res.status(200).json({ success: true, data: reservations });
    } catch (error) {
      next(error);
    }
  },

  // Use reservation (cafeteria staff)
  async useReservation(req, res, next) {
    try {
      const { id } = req.params;
      const { qr_code } = req.body;

      const reservation = await prisma.mealReservation.findUnique({
        where: { id },
        include: {
          menu: true,
          user: {
            include: {
              wallet: true
            }
          }
        }
      });

      if (!reservation) {
        return res.status(404).json({ success: false, error: 'Reservation not found' });
      }

      // Validate QR code
      if (reservation.qr_code !== qr_code) {
        return res.status(400).json({ success: false, error: 'Invalid QR code' });
      }

      // Check if today's date matches
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reservationDate = new Date(reservation.date);
      reservationDate.setHours(0, 0, 0, 0);

      if (reservationDate.getTime() !== today.getTime()) {
        return res.status(400).json({
          success: false,
          error: 'QR code is not valid for today'
        });
      }

      // Check if already used
      if (reservation.status === 'used') {
        return res.status(400).json({
          success: false,
          error: 'Reservation already used'
        });
      }

      // Mark as used
      const updatedReservation = await prisma.mealReservation.update({
        where: { id },
        data: {
          status: 'used',
          used_at: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          },
          menu: {
            include: {
              cafeteria: true
            }
          }
        }
      });

      // If paid, complete transaction (deduct from wallet)
      if (reservation.amount > 0 && reservation.user.wallet) {
        await PaymentService.deductFromWallet(
          reservation.user.wallet.id,
          reservation.amount,
          'meal_reservation',
          reservation.id,
          `Meal reservation - ${reservation.meal_type}`
        );
      }

      res.status(200).json({
        success: true,
        data: updatedReservation,
        message: 'Reservation used successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = mealsController;



