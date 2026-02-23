const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { createBooking, getBooking, getMyBookings, getAgencyBookings, cancelBooking, confirmBooking } = require('../controllers/bookingController');

// Create booking (must be authenticated user)
router.post('/', protect, authorizeRoles('USER','ADMIN'), createBooking);
router.get('/my', protect, authorizeRoles('USER', 'ADMIN'), getMyBookings);
// Agency bookings — bookings for packages owned by this agency
router.get('/agency', protect, authorizeRoles('AGENCY'), getAgencyBookings);
router.get('/:id', protect, getBooking);
// Confirm booking (user or admin)
router.post('/:id/confirm', protect, confirmBooking);
// Cancel booking (user or admin)
router.post('/:id/cancel', protect, cancelBooking);

module.exports = router;
