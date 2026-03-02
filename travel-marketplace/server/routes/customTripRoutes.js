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
  updateExpense,
  removeExpense,
  duplicateTrip,
  getTripSummary,
  // Collaborative
  enableSharing,
  disableSharing,
  getSharedTrip,
  joinSharedTrip,
  addCollaboratorExpense,
  updateCollaboratorChecklist,
  removeCollaborator,
  inviteCollaborator,
  // Split bills
  getSettlements,
  getSharedSettlements,
  // Budget optimizer
  optimizeBudget,
  getKnownDestinations
} = require('../controllers/customTripController');

// ── Public routes (shared trips, no auth) ──
router.get('/shared/:token', getSharedTrip);
router.get('/shared/:token/settlements', getSharedSettlements);

// ── Auth-required shared routes ──
router.post('/shared/:token/join', protect, authorizeRoles('USER'), joinSharedTrip);
router.post('/shared/:token/expenses', protect, authorizeRoles('USER'), addCollaboratorExpense);
router.post('/shared/:token/checklist', protect, authorizeRoles('USER'), updateCollaboratorChecklist);

// ── Protected user routes ──
router.use(protect, authorizeRoles('USER'));

// Templates & destinations (no :id param, must come before /:id)
router.get('/templates', getTemplates);
router.get('/destinations', getKnownDestinations);
router.post('/optimize-budget', optimizeBudget);

router.get('/my', getMyTrips);
router.get('/:id', getTrip);
router.post('/', createTrip);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

// Daily expenses
router.post('/:id/expenses', addExpense);
router.put('/:id/expenses/:expenseId', updateExpense);
router.delete('/:id/expenses/:expenseId', removeExpense);

// Duplicate & Summary
router.post('/:id/duplicate', duplicateTrip);
router.get('/:id/summary', getTripSummary);

// Collaborative
router.post('/:id/share', enableSharing);
router.delete('/:id/share', disableSharing);
router.post('/:id/invite', inviteCollaborator);
router.delete('/:id/collaborators/:collabId', removeCollaborator);

// Split bills
router.get('/:id/settlements', getSettlements);

module.exports = router;
