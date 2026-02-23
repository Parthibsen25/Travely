const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const coupon = require('../controllers/couponController');

// User: validate a coupon code
router.post('/validate', protect, authorizeRoles('USER', 'ADMIN'), coupon.validateCoupon);

// Agency: manage own coupons
router.post('/', protect, authorizeRoles('AGENCY'), coupon.createCoupon);
router.get('/my', protect, authorizeRoles('AGENCY'), coupon.getMyCoupons);
router.put('/:id', protect, authorizeRoles('AGENCY'), coupon.updateCoupon);
router.delete('/:id', protect, authorizeRoles('AGENCY'), coupon.deleteCoupon);

// Admin: view all & approve/reject
router.get('/all', protect, authorizeRoles('ADMIN'), coupon.listAllCoupons);
router.post('/:id/review', protect, authorizeRoles('ADMIN'), coupon.reviewCoupon);

module.exports = router;
