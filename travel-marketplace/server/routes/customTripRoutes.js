const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getMyTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  getTemplates,
  addExpense,
  removeExpense,
  duplicateTrip,
  getTripSummary
} = require('../controllers/customTripController');

router.use(protect, authorizeRoles('USER'));

// Templates (no :id param, must come before /:id)
router.get('/templates', getTemplates);

router.get('/my', getMyTrips);
router.get('/:id', getTrip);
router.post('/', createTrip);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

// Daily expenses
router.post('/:id/expenses', addExpense);
router.delete('/:id/expenses/:expenseId', removeExpense);

// Duplicate & Summary
router.post('/:id/duplicate', duplicateTrip);
router.get('/:id/summary', getTripSummary);

module.exports = router;
