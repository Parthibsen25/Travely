const express = require('express');
const router = express.Router();
const { getUserAnalytics } = require('../controllers/analyticsController');
const { getDynamicPricing } = require('../services/dynamicPricingService');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/user', protect, authorizeRoles('USER'), getUserAnalytics);
router.get('/dynamic-pricing', getDynamicPricing);

module.exports = router;
