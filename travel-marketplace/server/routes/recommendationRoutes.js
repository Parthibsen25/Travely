const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const rec = require('../controllers/recommendationController');

// Personalized "For You" recommendations (user only)
router.get('/for-you', protect, authorizeRoles('USER'), rec.getRecommendations);

// Similar packages (public — used on package detail page)
router.get('/similar/:packageId', rec.getSimilarPackages);

// "Users who booked this also booked" (public)
router.get('/also-booked/:packageId', rec.getAlsoBooked);

module.exports = router;
