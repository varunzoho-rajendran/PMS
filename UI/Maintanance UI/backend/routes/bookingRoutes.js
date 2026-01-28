const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, bookingController.createBooking);
router.get('/user/my-bookings', authMiddleware, bookingController.getUserBookings);
router.get('/:id', authMiddleware, bookingController.getBookingById);
router.put('/:id', authMiddleware, adminMiddleware, bookingController.updateBookingStatus);
router.get('/admin/all', authMiddleware, adminMiddleware, bookingController.getAllBookings);

module.exports = router;
