const express = require('express');
const router = express.Router();
const { getMyReferral, getMyReferralCoupons } = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Get my referral code + stats
router.get('/me', protect, authorizeRoles('USER'), getMyReferral);

// Get coupons earned through referrals
router.get('/coupons', protect, authorizeRoles('USER'), getMyReferralCoupons);

module.exports = router;
