const express = require('express');
const router = express.Router();
const { register, login, agencyRegister, agencyLogin, logout, me, updateMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/agency-register', agencyRegister);
router.post('/agency-login', agencyLogin);
router.post('/logout', logout);
router.get('/me', me);
router.put('/me', protect, authorizeRoles('USER'), updateMe);
router.put('/change-password', protect, authorizeRoles('USER'), changePassword);

module.exports = router;
