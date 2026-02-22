const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema(
  {
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
    bookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    totalRevenue: { type: Number, required: true },
    commissionDeducted: { type: Number, required: true },
    payoutAmount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING','PAID'], default: 'PENDING' },
    payoutDate: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payout', PayoutSchema);
