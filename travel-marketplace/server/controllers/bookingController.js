const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Offer = require('../models/Offer');
const mongoose = require('mongoose');
const { computeFinalPrice } = require('../services/pricingService');
// Payment provider is disabled until configured. Commented out razorpay usage.
// const razorpay = require('../utils/razorpayClient');
const { computeCancellation } = require('../services/cancellationService');

exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId, travelDate, numberOfPeople = 1 } = req.body;
    const peopleCount = Number.parseInt(numberOfPeople, 10);

    if (!Number.isInteger(peopleCount) || peopleCount < 1) {
      return res.status(400).json({ message: 'numberOfPeople must be a positive integer' });
    }

    const pkg = await Package.findById(packageId).lean();
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // gather applicable offers similar to package detail
    const embeddedOffers = (pkg.offers || []).map((o) => ({
      title: o.title,
      discountType: 'PERCENTAGE',
      value: Number(o.discountPercent || 0),
      packageId: pkg._id,
      destination: pkg.destination
    }));
    const globalOffers = await Offer.find({
      $or: [
        { packageId: pkg._id },
        { destination: pkg.destination },
        { $and: [{ packageId: { $exists: false } }, { destination: { $exists: false } }] },
        { packageId: null, destination: null }
      ]
    }).lean();
    const availableOffers = [...embeddedOffers, ...globalOffers];

    const pricing = await computeFinalPrice({ basePrice: pkg.price, travelDate, availableOffers });
    const totalBasePrice = Number((Number(pkg.price || 0) * peopleCount).toFixed(2));
    const totalDiscount = Number((Number(pricing.discountAmount || 0) * peopleCount).toFixed(2));
    const totalFinalAmount = Number((Number(pricing.finalPrice || 0) * peopleCount).toFixed(2));

    const booking = await Booking.create({
      userId,
      packageId,
      travelDate,
      numberOfPeople: peopleCount,
      basePrice: totalBasePrice,
      discountApplied: totalDiscount,
      finalAmount: totalFinalAmount,
      amountMode: 'TOTAL',
      status: 'PENDING_PAYMENT'
    });

    // NOTE: Razorpay integration is currently disabled.
    // Return booking info and a message so frontend can proceed without payment.
    res.status(201).json({
      bookingId: booking._id,
      message: 'Booking created (payments disabled in this environment).',
      finalAmount: totalFinalAmount,
      perPersonAmount: pricing.finalPrice
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const filter = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const bookings = await Booking.find(filter)
      .sort('-createdAt')
      .populate('packageId', 'title destination category duration')
      .lean();
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBooking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }
    const booking = await Booking.findById(req.params.id).lean();
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // Only owner or admin can view
    if (req.user && req.user.id !== booking.userId.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // only owner or admin
    if (req.user.role !== 'ADMIN' && booking.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Refunds are disabled because payment provider is not configured.
    // We'll still allow cancelling the booking locally and record that no refund was issued.
    const calc = await computeCancellation({ booking, currentDate: req.body.currentDate || new Date() });
    booking.status = 'CANCELLED';
    booking.refundAmount = 0;
    booking.cancelledAt = new Date();
    await booking.save();
    return res.json({
      message: 'Booking cancelled (refunds disabled in this environment).',
      refundableAmount: calc.refundableAmount,
      commissionAdjustment: calc.commissionAdjustment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Webhook handler will be in payment controller (separate)
