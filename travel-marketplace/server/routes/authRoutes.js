const express = require('express');
const router = express.Router();
const { register, login, agencyRegister, agencyLogin, logout, me } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/agency-register', agencyRegister);
router.post('/agency-login', agencyLogin);
router.post('/logout', logout);
router.get('/me', me);

module.exports = router;
