const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { getMyPayouts } = require('../controllers/payoutController');

router.use(protect, authorizeRoles('AGENCY'));
router.get('/my', getMyPayouts);

module.exports = router;
