const express = require('express');
const router = express.Router();
const mealsController = require('../controllers/mealsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

// Menu routes
router.get('/menus', mealsController.getMenus);
router.get('/menus/:id', mealsController.getMenuById);
router.post('/menus', authenticate, authorize(['admin']), mealsController.createMenu);
router.put('/menus/:id', authenticate, authorize(['admin']), mealsController.updateMenu);
router.delete('/menus/:id', authenticate, authorize(['admin']), mealsController.deleteMenu);

// Reservation routes
router.post('/reservations', authenticate, mealsController.createReservation);
router.delete('/reservations/:id', authenticate, mealsController.cancelReservation);
router.get('/reservations/my-reservations', authenticate, mealsController.getMyReservations);
router.post('/reservations/:id/use', authenticate, authorize(['admin', 'faculty']), mealsController.useReservation);

module.exports = router;














