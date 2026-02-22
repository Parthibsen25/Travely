const Agency = require('../models/Agency');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payout = require('../models/Payout');

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
    const totalAgencies = await Agency.countDocuments();
    const pendingAgencyVerifications = await Agency.countDocuments({ verificationStatus: 'PENDING' });
    const totalBookings = await Booking.countDocuments();
    const disputedBookings = await Booking.countDocuments({ status: 'DISPUTED' });

    const agg = await Payout.aggregate([
      { $group: { _id: null, totalCommission: { $sum: '$commissionDeducted' }, totalPayouts: { $sum: '$payoutAmount' } } }
    ]);
    const totalCommissionRevenue = (agg[0] && agg[0].totalCommission) || 0;

    res.json({ totalAgencies, pendingAgencyVerifications, totalBookings, disputedBookings, totalCommissionRevenue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
