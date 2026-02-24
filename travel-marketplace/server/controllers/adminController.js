const Agency = require('../models/Agency');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payout = require('../models/Payout');
const Package = require('../models/Package');
const Review = require('../models/Review');

exports.listAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find().sort('-createdAt');
    res.json({ agencies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyAgency = async (req, res) => {
  try {
    const id = req.params.id;
    const action = req.body.action; // 'approve' or 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    const agency = await Agency.findById(id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    if (action === 'approve') agency.verificationStatus = 'VERIFIED';
    else agency.verificationStatus = 'REJECTED';
    await agency.save();
    res.json({ agency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.suspendAgency = async (req, res) => {
  try {
    const id = req.params.id;
    const { suspend } = req.body; // boolean
    const agency = await Agency.findById(id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    agency.isSuspended = !!suspend;
    await agency.save();
    res.json({ agency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { suspend } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isSuspended = !!suspend;
    await user.save();
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort('-createdAt').populate('userId packageId');
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.manageDispute = async (req, res) => {
  try {
    const id = req.params.id;
    const action = req.body.action; // 'mark' or 'resolve'
    if (!['mark', 'resolve'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (action === 'mark') booking.status = 'DISPUTED';
    else if (action === 'resolve') booking.status = 'CONFIRMED';
    await booking.save();
    res.json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.analytics = async (req, res) => {
  try {
    // ── Core counts ──
    const [totalAgencies, pendingAgencyVerifications, verifiedAgencies, rejectedAgencies, suspendedAgencies] = await Promise.all([
      Agency.countDocuments(),
      Agency.countDocuments({ verificationStatus: 'PENDING' }),
      Agency.countDocuments({ verificationStatus: 'VERIFIED' }),
      Agency.countDocuments({ verificationStatus: 'REJECTED' }),
      Agency.countDocuments({ isSuspended: true }),
    ]);

    const totalUsers = await User.countDocuments();
    const totalPackages = await Package.countDocuments();
    const activePackages = await Package.countDocuments({ status: 'ACTIVE' });
    const totalReviews = await Review.countDocuments();

    // ── Booking stats by status ──
    const bookingStatusAgg = await Booking.aggregate([
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

    // ── Payout aggregation (new financial fields) ──
    const payoutAgg = await Payout.aggregate([
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
    let totalCommissionRevenue = 0;
    let totalPayoutAmount = 0;
    let totalGrossRevenue = 0;
    let totalGSTCollected = 0;
    let totalTDSCollected = 0;
    let totalGatewayFees = 0;
    let pendingPayouts = 0;
    let completedPayouts = 0;
    let scheduledPayouts = 0;
    payoutAgg.forEach(p => {
      totalCommissionRevenue += p.totalCommission;
      totalPayoutAmount += p.totalNetPayout;
      totalGrossRevenue += p.totalGross;
      totalGSTCollected += p.totalGST;
      totalTDSCollected += p.totalTDS;
      totalGatewayFees += p.totalGatewayFee;
      if (['PENDING', 'SCHEDULED'].includes(p._id)) scheduledPayouts += p.count;
      if (['PAID', 'COMPLETED'].includes(p._id)) completedPayouts += p.count;
    });

    // ── Monthly revenue trend (last 6 months) ──
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $in: ['CONFIRMED', 'COMPLETED'] } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$finalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // ── Top 5 agencies by revenue ──
    const topAgencies = await Payout.aggregate([
      { $group: { _id: '$agencyId', totalRevenue: { $sum: '$grossAmount' }, commission: { $sum: '$platformCommission' }, payouts: { $sum: '$netPayoutAmount' } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'agencies', localField: '_id', foreignField: '_id', as: 'agency' } },
      { $unwind: '$agency' },
      { $project: { businessName: '$agency.businessName', totalRevenue: 1, commission: 1, payouts: 1, tier: '$agency.commissionTier' } }
    ]);

    // ── Top 5 packages by bookings ──
    const topPackages = await Booking.aggregate([
      { $group: { _id: '$packageId', bookingCount: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'packages', localField: '_id', foreignField: '_id', as: 'package' } },
      { $unwind: '$package' },
      { $project: { title: '$package.title', destination: '$package.destination', bookingCount: 1, revenue: 1 } }
    ]);

    // ── Average booking value ──
    const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

    // ── Recent bookings (last 10) ──
    const recentBookings = await Booking.find()
      .sort('-createdAt')
      .limit(10)
      .populate('packageId', 'title destination')
      .populate('userId', 'name email')
      .lean();

    // ── Estimated platform commission (average ~18% across agencies, before payouts) ──
    const avgCommissionRate = 18; // Weighted average across tiers
    const estPlatformCommission = Math.round(confirmedRevenue * avgCommissionRate / 100);

    res.json({
      totalAgencies, pendingAgencyVerifications, verifiedAgencies, rejectedAgencies, suspendedAgencies,
      totalUsers, totalPackages, activePackages, totalReviews,
      totalBookings, bookingsByStatus,
      totalRevenue: Math.round(confirmedRevenue),
      totalCommissionRevenue: Math.round(totalCommissionRevenue) || estPlatformCommission,
      totalGSTCollected: Math.round(totalGSTCollected),
      totalTDSCollected: Math.round(totalTDSCollected),
      totalGatewayFees: Math.round(totalGatewayFees),
      totalPayoutAmount: Math.round(totalPayoutAmount),
      scheduledPayouts, completedPayouts,
      avgBookingValue,
      monthlyRevenue,
      topAgencies,
      topPackages,
      recentBookings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
