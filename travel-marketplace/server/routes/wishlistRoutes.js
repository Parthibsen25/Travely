const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
  checkWishlist
} = require('../controllers/wishlistController');

router.post('/', protect, authorizeRoles('USER'), addToWishlist);
router.delete('/:packageId', protect, authorizeRoles('USER'), removeFromWishlist);
router.get('/my', protect, authorizeRoles('USER'), getMyWishlist);
router.get('/check', protect, authorizeRoles('USER'), checkWishlist);

module.exports = router;
