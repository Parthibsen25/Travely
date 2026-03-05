const express = require('express');
const router = express.Router();
const { listCurrencies, convert, setPreference } = require('../controllers/currencyController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/supported', listCurrencies);
router.post('/convert', convert);
router.put('/preference', protect, authorizeRoles('USER'), setPreference);

module.exports = router;
