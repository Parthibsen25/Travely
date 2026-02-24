const Payout = require('../models/Payout');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Review = require('../models/Review');
const Agency = require('../models/Agency');
const { TIER_CONFIG, getTierConfig, DEDUCTION_RATES } = require('../services/commissionService');

exports.getMyPayouts = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const payouts = await Payout.find({ agencyId }).sort('-createdAt');
    res.json({ payouts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAgencyAnalytics = async (req, res) => {
  try {
    const agencyId = req.user.id;

    // ── Agency info ──
    const agency = await Agency.findById(agencyId)
      .select('businessName commissionTier verificationStatus createdAt quarterlyGMV lifetimeGMV')
      .lean();

    // ── Package stats ──
    const packages = await Package.find({ agencyId }).lean();
    const packageIds = packages.map(p => p._id);
    const totalPackages = packages.length;
    const activePackages = packages.filter(p => p.status === 'ACTIVE').length;
    const avgPackagePrice = totalPackages > 0 ? Math.round(packages.reduce((s, p) => s + (p.price || 0), 0) / totalPackages) : 0;

    // ── Booking stats ──
    const bookingStatusAgg = await Booking.aggregate([
      { $match: { packageId: { $in: packageIds } } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } }
    ]);
    const bookingsByStatus = {};
    let totalBookings = 0;
    let totalRevenue = 0;
    let confirmedRevenue = 0;
    bookingStatusAgg.forEach(s => {
      bookingsByStatus[s._id] = s.count;
      totalBookings += s.count;
      totalRevenue += s.revenue;
      if (['CONFIRMED', 'COMPLETED'].includes(s._id)) confirmedRevenue += s.revenue;
    });

    // ── Payout stats (new financial fields) ──
    const payoutAgg = await Payout.aggregate([
      { $match: { agencyId: agency._id } },
      {
        $group: {
          _id: '$status',
          totalGross: { $sum: '$grossAmount' },
          totalCommission: { $sum: '$platformCommission' },
          totalGST: { $sum: '$gstOnCommission' },
          totalTDS: { $sum: '$tdsDeducted' },
          totalGatewayFee: { $sum: '$paymentGatewayFee' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalNetPayout: { $sum: '$netPayoutAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    let totalCommissionPaid = 0;
    let totalGSTPaid = 0;
    let totalTDSDeducted = 0;
    let totalGatewayFees = 0;
    let totalAllDeductions = 0;
    let netPayoutTotal = 0;
    let grossPayoutRevenue = 0;
    let scheduledPayouts = 0;
    let completedPayouts = 0;
    let processingPayouts = 0;
    let failedPayouts = 0;
    payoutAgg.forEach(p => {
      totalCommissionPaid += p.totalCommission;
      totalGSTPaid += p.totalGST;
      totalTDSDeducted += p.totalTDS;
      totalGatewayFees += p.totalGatewayFee;
      totalAllDeductions += p.totalDeductions;
      netPayoutTotal += p.totalNetPayout;
      grossPayoutRevenue += p.totalGross;
      if (p._id === 'SCHEDULED') scheduledPayouts = p.count;
      if (p._id === 'COMPLETED' || p._id === 'PAID') completedPayouts += p.count;
      if (p._id === 'PROCESSING') processingPayouts = p.count;
      if (p._id === 'FAILED') failedPayouts = p.count;
    });

    // ── Monthly revenue trend (last 6 months) ──
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Booking.aggregate([
      { $match: { packageId: { $in: packageIds }, createdAt: { $gte: sixMonthsAgo }, status: { $in: ['CONFIRMED', 'COMPLETED'] } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$finalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // ── Top 5 packages by bookings ──
    const topPackages = await Booking.aggregate([
      { $match: { packageId: { $in: packageIds } } },
      { $group: { _id: '$packageId', bookingCount: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'packages', localField: '_id', foreignField: '_id', as: 'package' } },
      { $unwind: '$package' },
      { $project: { title: '$package.title', destination: '$package.destination', bookingCount: 1, revenue: 1, rating: '$package.rating' } }
    ]);

    // ── Review stats ──
    const reviewAgg = await Review.aggregate([
      { $match: { packageId: { $in: packageIds } } },
      { $group: { _id: null, totalReviews: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
    ]);
    const totalReviews = reviewAgg[0]?.totalReviews || 0;
    const avgRating = reviewAgg[0]?.avgRating ? Number(reviewAgg[0].avgRating.toFixed(1)) : 0;

    // ── Recent bookings (last 10) ──
    const recentBookings = await Booking.find({ packageId: { $in: packageIds } })
      .sort('-createdAt')
      .limit(10)
      .populate('packageId', 'title destination')
      .populate('userId', 'name email')
      .lean();

    // ── Average booking value ──
    const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

    // ── Commission tier info (from new TIER_CONFIG) ──
    const tierInfo = getTierConfig(agency.commissionTier || 'STARTER');
    const commissionRate = tierInfo.rate;

    // ── Estimated commission from confirmed/completed bookings (before payouts are generated) ──
    const estimatedCommission = Math.round(confirmedRevenue * commissionRate / 100);
    const estimatedGST = Math.round(estimatedCommission * DEDUCTION_RATES.GST_ON_COMMISSION / 100);
    const estimatedTDS = Math.round(confirmedRevenue * DEDUCTION_RATES.TDS_PERCENT / 100);
    const estimatedGateway = Math.round(confirmedRevenue * DEDUCTION_RATES.PAYMENT_GATEWAY_PERCENT / 100);
    const estimatedTotalDeductions = estimatedCommission + estimatedGST + estimatedTDS + estimatedGateway;
    const estimatedNetEarnings = Math.round(confirmedRevenue - estimatedTotalDeductions);

    res.json({
      agency: {
        businessName: agency.businessName,
        commissionTier: agency.commissionTier || 'STARTER',
        commissionRate,
        tierLabel: tierInfo.label,
        tierDescription: tierInfo.description,
        settlementCycle: tierInfo.settlementCycle,
        quarterlyGMV: agency.quarterlyGMV || 0,
        lifetimeGMV: agency.lifetimeGMV || 0,
        nextTierGMV: tierInfo.maxQuarterlyGMV === Infinity ? null : tierInfo.maxQuarterlyGMV,
        verificationStatus: agency.verificationStatus,
        memberSince: agency.createdAt
      },
      packages: { total: totalPackages, active: activePackages, inactive: totalPackages - activePackages, avgPrice: avgPackagePrice },
      bookings: { total: totalBookings, byStatus: bookingsByStatus, avgValue: avgBookingValue },
      earnings: {
        totalRevenue: Math.round(confirmedRevenue),
        grossPayoutRevenue: Math.round(grossPayoutRevenue),
        commissionPaid: Math.round(totalCommissionPaid),
        gstPaid: Math.round(totalGSTPaid),
        tdsDeducted: Math.round(totalTDSDeducted),
        gatewayFees: Math.round(totalGatewayFees),
        totalDeductions: Math.round(totalAllDeductions),
        netPayout: Math.round(netPayoutTotal),
        scheduledPayouts,
        completedPayouts,
        processingPayouts,
        failedPayouts,
        // Estimated figures from confirmed bookings (shown even before payouts are created)
        estimatedCommission,
        estimatedGST,
        estimatedTDS,
        estimatedGateway,
        estimatedTotalDeductions,
        estimatedNetEarnings
      },
      reviews: { total: totalReviews, avgRating },
      monthlyRevenue,
      topPackages,
      recentBookings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
