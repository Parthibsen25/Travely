const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    // recipientId + recipientRole together identify who gets the notification
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    recipientRole: { type: String, enum: ['USER', 'AGENCY', 'ADMIN'], required: true },
    type: {
      type: String,
      enum: [
        'BOOKING_CREATED',      // agency gets notified when someone books their package
        'COUPON_CREATED',       // admin gets notified when agency creates a coupon
        'COUPON_APPROVED',      // agency gets notified when admin approves their coupon
        'COUPON_REJECTED',      // agency gets notified when admin rejects their coupon
        'BOOKING_CANCELLED',    // agency gets notified when booking is cancelled
        'GENERAL',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    // optional reference to the related document
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    referenceModel: { type: String, enum: ['Booking', 'Coupon', 'Package'] },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, recipientRole: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
