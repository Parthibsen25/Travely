const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    // The user who initiated the conversation
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // The agency being conversed with
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
    // Optional reference to a package this conversation is about
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', default: null },
    // Last message text (for preview in conversation list)
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    // Unread counts for each participant
    userUnread: { type: Number, default: 0 },
    agencyUnread: { type: Number, default: 0 },
    // Status
    status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' }
  },
  { timestamps: true }
);

// One conversation per user-agency-package combo
ConversationSchema.index({ userId: 1, agencyId: 1, packageId: 1 }, { unique: true });
ConversationSchema.index({ userId: 1, lastMessageAt: -1 });
ConversationSchema.index({ agencyId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
