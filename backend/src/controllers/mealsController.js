const prisma = require('../prisma');
const crypto = require('crypto');

// Get all menus
const getMenus = async (req, res) => {
  try {
    const { date } = req.query;
    
    const where = {};
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      where.date = {
        gte: targetDate,
        lt: nextDate
      };
    }

    const menus = await prisma.mealMenu.findMany({
      where,
      include: {
        cafeteria: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    res.json({ success: true, data: menus });
  } catch (error) {
    console.error('Error getting menus:', error);
    res.status(500).json({ success: false, error: 'Failed to get menus' });
  }
};

// Get menu by ID
const getMenuById = async (req, res) => {
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
    res.json({ success: true, data: menu });
  } catch (error) {
    console.error('Error getting menu:', error);
    res.status(500).json({ success: false, error: 'Failed to get menu' });
  }
};

// Create menu
const createMenu = async (req, res) => {
  try {
    const { cafeteriaId, date, mealType, itemsJson, nutritionJson, isPublished } = req.body;
    const menu = await prisma.mealMenu.create({
      data: {
        cafeteriaId,
        date: new Date(date),
        mealType,
        itemsJson,
        nutritionJson,
        isPublished: isPublished || false
      }
    });
    res.status(201).json({ success: true, data: menu });
  } catch (error) {
    console.error('Error creating menu:', error);
    res.status(500).json({ success: false, error: 'Failed to create menu' });
  }
};

// Update menu
const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, mealType, itemsJson, nutritionJson, isPublished } = req.body;
    const menu = await prisma.mealMenu.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(mealType && { mealType }),
        ...(itemsJson && { itemsJson }),
        ...(nutritionJson && { nutritionJson }),
        ...(isPublished !== undefined && { isPublished })
      }
    });
    res.json({ success: true, data: menu });
  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(500).json({ success: false, error: 'Failed to update menu' });
  }
};

// Delete menu
const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.mealMenu.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(500).json({ success: false, error: 'Failed to delete menu' });
  }
};

// Create reservation
const createReservation = async (req, res) => {
  try {
    const { menu_id, cafeteria_id, meal_type, date, amount } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!menu_id || !cafeteria_id || !meal_type || !date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: menu_id, cafeteria_id, meal_type, date' 
      });
    }

    // Get menu to verify it exists and get price if amount not provided
    const menu = await prisma.mealMenu.findUnique({
      where: { id: menu_id },
      include: { cafeteria: true }
    });

    if (!menu) {
      return res.status(404).json({ 
        success: false, 
        error: 'Menu not found' 
      });
    }

    // Generate QR code
    const qrCode = crypto.randomUUID();

    // Calculate amount if not provided (default to 0 for free meals)
    const finalAmount = amount !== undefined ? parseFloat(amount) : 0;

    // Check wallet balance if amount > 0
    if (finalAmount > 0) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet || wallet.balance < finalAmount) {
        return res.status(400).json({ 
          success: false, 
          error: 'Insufficient wallet balance' 
        });
      }

      // Deduct from wallet
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: finalAmount
          }
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'payment',
          amount: finalAmount,
          balanceAfter: wallet.balance - finalAmount,
          referenceType: 'meal_reservation',
          description: `Meal reservation for ${meal_type} on ${date}`
        }
      });
    }

    const reservation = await prisma.mealReservation.create({
      data: {
        userId,
        menuId: menu_id,
        cafeteriaId: cafeteria_id,
        mealType: meal_type,
        date: new Date(date),
        amount: finalAmount,
        qrCode: qrCode,
        status: 'reserved'
      },
      include: {
        menu: {
          include: {
            cafeteria: true
          }
        }
      }
    });

    res.status(201).json({ success: true, data: reservation });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create reservation',
      details: error.message 
    });
  }
};

// Cancel reservation
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const reservation = await prisma.mealReservation.delete({
      where: {
        id,
        userId // Ensure user can only cancel their own reservations
      }
    });
    res.json({ success: true, message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel reservation' });
  }
};

// Get my reservations
const getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const reservations = await prisma.mealReservation.findMany({
      where: { userId },
      include: {
        menu: {
          include: {
            cafeteria: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({ success: true, data: reservations });
  } catch (error) {
    console.error('Error getting reservations:', error);
    res.status(500).json({ success: false, error: 'Failed to get reservations' });
  }
};

// Use reservation
const useReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await prisma.mealReservation.update({
      where: { id },
      data: {
        usedAt: new Date()
      }
    });
    res.json({ success: true, data: reservation });
  } catch (error) {
    console.error('Error using reservation:', error);
    res.status(500).json({ success: false, error: 'Failed to use reservation' });
  }
};

module.exports = {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  createReservation,
  cancelReservation,
  getMyReservations,
  useReservation
};
