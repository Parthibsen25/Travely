const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['PERCENTAGE', 'FLAT'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    // empty means applicable to ALL packages of this agency
    applicablePackages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Package' }],
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    maxUsage: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 }, // 0 = no cap (for percentage coupons)
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 });
CouponSchema.index({ agencyId: 1 });

module.exports = mongoose.model('Coupon', CouponSchema);
