const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const notif = require('../controllers/notificationController');

router.get('/', protect, notif.getMyNotifications);
router.get('/unread-count', protect, notif.getUnreadCount);
router.post('/read-all', protect, notif.markAllAsRead);
router.post('/:id/read', protect, notif.markAsRead);

module.exports = router;
