const User = require('../models/User');
const Referral = require('../models/Referral');
const Coupon = require('../models/Coupon');
const crypto = require('crypto');

// ── Config ──────────────────────────────────────────────
const REFERRAL_REWARD = {
  discountType: 'PERCENTAGE',
  discountValue: 10,      // 10% off
  maxDiscount: 500,        // up to ₹500
  expiryDays: 90,          // valid for 90 days
};

// ── Helper: create a platform coupon ────────────────────
async function createReferralCoupon(userId, label) {
  const randomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  const code = `REF${label}${randomCode}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFERRAL_REWARD.expiryDays);

  const coupon = await Coupon.create({
    code,
    description: `Referral reward — ${REFERRAL_REWARD.discountValue}% off (up to ₹${REFERRAL_REWARD.maxDiscount})`,
    discountType: REFERRAL_REWARD.discountType,
    discountValue: REFERRAL_REWARD.discountValue,
    maxDiscount: REFERRAL_REWARD.maxDiscount,
    maxUsage: 1,
    maxUsagePerUser: 1,
    isPlatformCoupon: true,
    status: 'APPROVED',          // auto-approved for referral
    isActive: true,
    expiresAt,
    applicablePackages: [],
    agencyId: null,
  });
  return coupon;
}

// ── Get my referral info ────────────────────────────────
exports.getMyReferral = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('referralCode name');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate referral code for existing users who don't have one
    if (!user.referralCode) {
      const crypto = require('crypto');
      const namePart = (user.name || 'USER').replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
      const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
      user.referralCode = `${namePart}${randomPart}`;
      await user.save();
    }

    user = user.toObject();

    const referrals = await Referral.find({ referrerId: req.user.id })
      .populate('refereeId', 'name email createdAt')
      .populate('referrerCouponId', 'code discountType discountValue maxDiscount expiresAt usedCount')
      .sort('-createdAt')
      .lean();

    const totalReferrals = referrals.length;
    const rewarded = referrals.filter((r) => r.status === 'REWARDED').length;

    res.json({
      referralCode: user.referralCode,
      totalReferrals,
      rewarded,
      referrals,
    });
  } catch (err) {
    console.error('getMyReferral error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Apply referral code (called during registration) ────
exports.applyReferral = async (refereeUser, referralCode) => {
  try {
    if (!referralCode) return null;

    const referrer = await User.findOne({
      referralCode: referralCode.toUpperCase(),
      role: 'USER',
    });
    if (!referrer) return null;

    // Can't refer yourself
    if (referrer._id.toString() === refereeUser._id.toString()) return null;

    // Check if referee already has a referral record
    const existing = await Referral.findOne({ refereeId: refereeUser._id });
    if (existing) return null;

    // Create reward coupons for both
    const referrerCoupon = await createReferralCoupon(referrer._id, 'RR');
    const refereeCoupon = await createReferralCoupon(refereeUser._id, 'RE');

    // Create referral record
    const referral = await Referral.create({
      referrerId: referrer._id,
      refereeId: refereeUser._id,
      referralCode: referralCode.toUpperCase(),
      status: 'REWARDED',
      referrerCouponId: referrerCoupon._id,
      refereeCouponId: refereeCoupon._id,
      rewardedAt: new Date(),
    });

    // Update referee's referredBy field
    refereeUser.referredBy = referrer._id;
    await refereeUser.save();

    return {
      referral,
      referrerCoupon: referrerCoupon.code,
      refereeCoupon: refereeCoupon.code,
    };
  } catch (err) {
    console.error('applyReferral error:', err);
    return null;
  }
};

// ── Get my referral coupons (earned through referrals) ───
exports.getMyReferralCoupons = async (req, res) => {
  try {
    const userId = req.user.id;

    // Coupons where I am the referrer
    const asReferrer = await Referral.find({ referrerId: userId, status: 'REWARDED' })
      .populate('referrerCouponId', 'code discountType discountValue maxDiscount expiresAt usedCount isActive')
      .lean();

    // Coupon where I am the referee
    const asReferee = await Referral.findOne({ refereeId: userId, status: 'REWARDED' })
      .populate('refereeCouponId', 'code discountType discountValue maxDiscount expiresAt usedCount isActive')
      .lean();

    const coupons = [];
    asReferrer.forEach((r) => {
      if (r.referrerCouponId) {
        coupons.push({ ...r.referrerCouponId, source: 'referrer' });
      }
    });
    if (asReferee && asReferee.refereeCouponId) {
      coupons.push({ ...asReferee.refereeCouponId, source: 'referee' });
    }

    res.json({ coupons });
  } catch (err) {
    console.error('getMyReferralCoupons error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
