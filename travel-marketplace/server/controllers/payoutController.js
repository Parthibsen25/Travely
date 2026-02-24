const Payout = require('../models/Payout');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Review = require('../models/Review');
const Agency = require('../models/Agency');

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
    const agency = await Agency.findById(agencyId).select('businessName commissionTier verificationStatus createdAt').lean();

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

    // ── Payout stats ──
    const payoutAgg = await Payout.aggregate([
      { $match: { agencyId: agency._id } },
      { $group: { _id: '$status', totalCommission: { $sum: '$commissionDeducted' }, totalPayouts: { $sum: '$payoutAmount' }, totalRevenue: { $sum: '$totalRevenue' }, count: { $sum: 1 } } }
    ]);
    let commissionPaid = 0;
    let netPayout = 0;
    let payoutRevenue = 0;
    let pendingPayouts = 0;
    let paidPayouts = 0;
    payoutAgg.forEach(p => {
      commissionPaid += p.totalCommission;
      netPayout += p.totalPayouts;
      payoutRevenue += p.totalRevenue;
      if (p._id === 'PENDING') pendingPayouts = p.count;
      if (p._id === 'PAID') paidPayouts = p.count;
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

    // ── Commission tier info ──
    const TIER_RATES = { STANDARD: 8, SILVER: 6, GOLD: 4, PLATINUM: 2 };
    const commissionRate = TIER_RATES[(agency.commissionTier || 'STANDARD').toUpperCase()] || 8;

    res.json({
      agency: { businessName: agency.businessName, commissionTier: agency.commissionTier, commissionRate, verificationStatus: agency.verificationStatus, memberSince: agency.createdAt },
      packages: { total: totalPackages, active: activePackages, inactive: totalPackages - activePackages, avgPrice: avgPackagePrice },
      bookings: { total: totalBookings, byStatus: bookingsByStatus, avgValue: avgBookingValue },
      earnings: { totalRevenue: Math.round(confirmedRevenue), commissionPaid: Math.round(commissionPaid), netPayout: Math.round(netPayout), pendingPayouts, paidPayouts },
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
