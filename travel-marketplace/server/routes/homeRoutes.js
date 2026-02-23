const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { getHomeSummary } = require('../controllers/homeController');

router.get('/summary', protect, authorizeRoles('USER'), getHomeSummary);

module.exports = router;
