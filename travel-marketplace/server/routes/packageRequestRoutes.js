const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/packageRequestController');

// User endpoints
router.post('/', protect, authorizeRoles('USER'), ctrl.createRequest);
router.get('/my', protect, authorizeRoles('USER'), ctrl.getMyRequests);
router.post('/:id/cancel', protect, authorizeRoles('USER'), ctrl.cancelRequest);

// Agency endpoints
router.get('/all', protect, authorizeRoles('AGENCY'), ctrl.listRequests);
router.post('/:id/respond', protect, authorizeRoles('AGENCY'), ctrl.respondToRequest);

module.exports = router;
