const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { createBooking, getBooking, getMyBookings, getAgencyBookings, cancelBooking, payBooking, confirmBooking, completeBooking } = require('../controllers/bookingController');

// Create booking (must be authenticated user)
router.post('/', protect, authorizeRoles('USER','ADMIN'), createBooking);
router.get('/my', protect, authorizeRoles('USER', 'ADMIN'), getMyBookings);
// Agency bookings — bookings for packages owned by this agency
router.get('/agency', protect, authorizeRoles('AGENCY'), getAgencyBookings);
router.get('/:id', protect, getBooking);
// Pay booking — user simulates payment (PENDING_PAYMENT → PAID)
router.post('/:id/pay', protect, authorizeRoles('USER', 'ADMIN'), payBooking);
// Confirm booking — agency confirms (PAID → CONFIRMED)
router.post('/:id/confirm', protect, authorizeRoles('AGENCY', 'ADMIN'), confirmBooking);
// Complete booking — agency marks as completed (CONFIRMED → COMPLETED)
router.post('/:id/complete', protect, authorizeRoles('AGENCY', 'ADMIN'), completeBooking);
// Cancel booking (user or admin)
router.post('/:id/cancel', protect, cancelBooking);

module.exports = router;
