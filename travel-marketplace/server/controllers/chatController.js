const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Package = require('../models/Package');

// Start or get a conversation (USER starts with agency about a package)
exports.startConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { agencyId, packageId, message } = req.body;

    if (!agencyId) return res.status(400).json({ message: 'agencyId is required' });
    if (!message || !message.trim()) return res.status(400).json({ message: 'message is required' });

    // Validate package belongs to agency if provided
    if (packageId) {
      const pkg = await Package.findById(packageId).lean();
      if (!pkg) return res.status(404).json({ message: 'Package not found' });
      if (String(pkg.agencyId) !== agencyId) {
        return res.status(400).json({ message: 'Package does not belong to this agency' });
      }
    }

    // Find or create conversation
    const findQuery = { userId, agencyId };
    if (packageId) {
      findQuery.packageId = packageId;
    } else {
      findQuery.packageId = null;
    }

    let conversation = await Conversation.findOne(findQuery);
    let isNew = false;

    if (!conversation) {
      isNew = true;
      conversation = await Conversation.create({
        userId,
        agencyId,
        packageId: packageId || null,
        lastMessage: message.trim(),
        lastMessageAt: new Date(),
        agencyUnread: 1
      });
    }

    // Create the first message
    const msg = await Message.create({
      conversationId: conversation._id,
      senderId: userId,
      senderRole: 'USER',
      text: message.trim()
    });

    // Update conversation metadata
    if (!isNew) {
      conversation.lastMessage = message.trim();
      conversation.lastMessageAt = new Date();
      conversation.agencyUnread += 1;
      await conversation.save();
    }

    // Emit via Socket.io if available
    if (req.app.get('io')) {
      req.app.get('io').to(`agency_${agencyId}`).emit('new_message', {
        conversationId: conversation._id,
        message: msg
      });
    }

    res.status(201).json({ conversation, message: msg });
  } catch (err) {
    // Duplicate key means conversation already exists — just return it
    if (err.code === 11000) {
      const conversation = await Conversation.findOne({
        userId: req.user.id,
        agencyId: req.body.agencyId,
        packageId: req.body.packageId || null
      });
      return res.json({ conversation, message: null, alreadyExists: true });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get conversations for the current user/agency
exports.getConversations = async (req, res) => {
  try {
    const { role, id } = req.user;
    const filter = role === 'AGENCY' ? { agencyId: id } : { userId: id };

    const conversations = await Conversation.find(filter)
      .sort({ lastMessageAt: -1 })
      .populate('userId', 'name email')
      .populate('agencyId', 'businessName email')
      .populate('packageId', 'title imageUrl destination price')
      .lean();

    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { role, id } = req.user;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    // Only participants can see messages
    const isParticipant =
      (role === 'USER' && String(conversation.userId) === id) ||
      (role === 'AGENCY' && String(conversation.agencyId) === id);
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30));
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Mark messages from the other party as read
    const otherRole = role === 'USER' ? 'AGENCY' : 'USER';
    await Message.updateMany(
      { conversationId, senderRole: otherRole, isRead: false },
      { isRead: true }
    );

    // Reset unread count for current user
    if (role === 'USER') {
      conversation.userUnread = 0;
    } else {
      conversation.agencyUnread = 0;
    }
    await conversation.save();

    res.json({ messages: messages.reverse(), page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const { role, id } = req.user;

    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required' });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const isParticipant =
      (role === 'USER' && String(conversation.userId) === id) ||
      (role === 'AGENCY' && String(conversation.agencyId) === id);
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });

    const senderRole = role === 'AGENCY' ? 'AGENCY' : 'USER';

    const message = await Message.create({
      conversationId,
      senderId: id,
      senderRole,
      text: text.trim()
    });

    // Update conversation metadata
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    if (senderRole === 'USER') {
      conversation.agencyUnread += 1;
    } else {
      conversation.userUnread += 1;
    }
    await conversation.save();

    // Emit via Socket.io
    if (req.app.get('io')) {
      const io = req.app.get('io');
      if (senderRole === 'USER') {
        io.to(`agency_${conversation.agencyId}`).emit('new_message', {
          conversationId: conversation._id,
          message
        });
      } else {
        io.to(`user_${conversation.userId}`).emit('new_message', {
          conversationId: conversation._id,
          message
        });
      }
    }

    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get total unread count across all conversations
exports.getUnreadCount = async (req, res) => {
  try {
    const { role, id } = req.user;
    const filter = role === 'AGENCY' ? { agencyId: id } : { userId: id };
    const unreadField = role === 'AGENCY' ? 'agencyUnread' : 'userUnread';

    const result = await Conversation.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: `$${unreadField}` } } }
    ]);

    res.json({ unreadCount: result[0]?.total || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
