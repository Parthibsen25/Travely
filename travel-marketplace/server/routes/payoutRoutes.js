const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { getMyPayouts, getAgencyAnalytics } = require('../controllers/payoutController');

router.use(protect, authorizeRoles('AGENCY'));
router.get('/my', getMyPayouts);
router.get('/analytics', getAgencyAnalytics);

module.exports = router;
