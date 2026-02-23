const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    travelDate: { type: Date, required: true },
    numberOfPeople: { type: Number, required: true, default: 1 },
    basePrice: { type: Number, required: true },
    discountApplied: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    amountMode: { type: String, enum: ['PER_PERSON', 'TOTAL'], default: 'TOTAL' },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT','CONFIRMED','CANCELLED','COMPLETED','REFUND_INITIATED','REFUNDED','DISPUTED'],
      default: 'PENDING_PAYMENT'
    },
    paymentId: { type: String },
    paymentOrderId: { type: String },
    payoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payout' },
    refundId: { type: String },
    refundAmount: { type: Number },
    cancelledAt: { type: Date },
    confirmedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
