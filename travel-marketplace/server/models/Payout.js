const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema(
  {
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
    bookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],

    // ── Financial breakdown ──
    grossAmount: { type: Number, required: true },          // Total booking GMV
    platformCommission: { type: Number, required: true },   // Commission % of GMV
    commissionRate: { type: Number, required: true },        // The % applied
    gstOnCommission: { type: Number, default: 0 },          // 18% GST on commission
    tdsDeducted: { type: Number, default: 0 },              // TDS @ 1% of GMV (Section 194-O)
    paymentGatewayFee: { type: Number, default: 0 },        // ~2% gateway processing
    totalDeductions: { type: Number, required: true },       // Sum of all deductions
    netPayoutAmount: { type: Number, required: true },       // Agency receives this

    // ── Legacy fields (backward compat) ──
    totalRevenue: { type: Number },
    commissionDeducted: { type: Number },
    payoutAmount: { type: Number },

    // ── Settlement ──
    settlementCycle: { type: String, enum: ['T+7', 'T+14'], default: 'T+7' },
    scheduledDate: { type: Date },                           // When payout is scheduled
    processedDate: { type: Date },                           // When actually processed
    status: {
      type: String,
      enum: ['SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'ON_HOLD', 'PENDING', 'PAID'],
      default: 'SCHEDULED'
    },
    failureReason: { type: String },
    payoutDate: { type: Date },

    // ── Reference ──
    invoiceNumber: { type: String },
    remarks: { type: String }
  },
  { timestamps: true }
);

PayoutSchema.index({ agencyId: 1, status: 1 });
PayoutSchema.index({ scheduledDate: 1, status: 1 });

module.exports = mongoose.model('Payout', PayoutSchema);
