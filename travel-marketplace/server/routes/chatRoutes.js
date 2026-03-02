const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const chat = require('../controllers/chatController');

// Start a conversation (user only)
router.post('/conversations', protect, authorizeRoles('USER'), chat.startConversation);

// Get all conversations for current user/agency
router.get('/conversations', protect, authorizeRoles('USER', 'AGENCY'), chat.getConversations);

// Get unread message count
router.get('/unread-count', protect, authorizeRoles('USER', 'AGENCY'), chat.getUnreadCount);

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', protect, authorizeRoles('USER', 'AGENCY'), chat.getMessages);

// Send message to a conversation
router.post('/conversations/:conversationId/messages', protect, authorizeRoles('USER', 'AGENCY'), chat.sendMessage);

module.exports = router;
