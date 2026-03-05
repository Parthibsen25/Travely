const express = require('express');
const router = express.Router();
const {
  submitVerification,
  getVerificationStatus,
  getAgencyBadge,
  reviewVerification
} = require('../controllers/agencyVerificationController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Agency endpoints
router.post('/submit', protect, authorizeRoles('AGENCY'), submitVerification);
router.get('/status', protect, authorizeRoles('AGENCY'), getVerificationStatus);

// Public badge
router.get('/badge/:agencyId', getAgencyBadge);

// Admin review
router.put('/review/:agencyId', protect, authorizeRoles('ADMIN'), reviewVerification);

module.exports = router;
