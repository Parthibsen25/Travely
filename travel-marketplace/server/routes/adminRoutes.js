const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const admin = require('../controllers/adminController');

router.use(protect, authorizeRoles('ADMIN'));

router.get('/agencies', admin.listAgencies);
router.post('/agencies/:id/verify', admin.verifyAgency);
router.post('/agencies/:id/suspend', admin.suspendAgency);
router.post('/users/:id/suspend', admin.suspendUser);

router.get('/bookings', admin.listBookings);
router.post('/bookings/:id/dispute', admin.manageDispute);

router.get('/analytics', admin.analytics);

module.exports = router;
