const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema(
  {
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referralCode: { type: String, required: true },
    status: {
      type: String,
      enum: ['SIGNED_UP', 'REWARDED'],
      default: 'SIGNED_UP',
    },
    referrerCouponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    refereeCouponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    rewardedAt: { type: Date },
  },
  { timestamps: true }
);

ReferralSchema.index({ referrerId: 1 });
ReferralSchema.index({ refereeId: 1 }, { unique: true }); // a user can only be referred once

module.exports = mongoose.model('Referral', ReferralSchema);
