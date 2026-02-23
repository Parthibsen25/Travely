const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getMyTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip
} = require('../controllers/customTripController');

router.use(protect, authorizeRoles('USER'));

router.get('/my', getMyTrips);
router.get('/:id', getTrip);
router.post('/', createTrip);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

module.exports = router;
