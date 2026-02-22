const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  createReview,
  getPackageReviews,
  getMyReviews
} = require('../controllers/reviewController');

router.post('/', protect, authorizeRoles('USER'), createReview);
router.get('/package/:packageId', getPackageReviews);
router.get('/my', protect, authorizeRoles('USER'), getMyReviews);

module.exports = router;
