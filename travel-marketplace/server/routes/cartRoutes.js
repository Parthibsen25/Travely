const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartCount,
} = require('../controllers/cartController');

router.get('/', protect, authorizeRoles('USER'), getCart);
router.post('/', protect, authorizeRoles('USER'), addToCart);
router.delete('/:packageId', protect, authorizeRoles('USER'), removeFromCart);
router.delete('/', protect, authorizeRoles('USER'), clearCart);
router.get('/count', protect, authorizeRoles('USER'), getCartCount);

module.exports = router;
