const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Offer = require('../models/Offer');
const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { computeFinalPrice } = require('../services/pricingService');
const { computeCancellation } = require('../services/cancellationService');
const { updateAgencyGMV } = require('../services/commissionService');

exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId, travelDate, numberOfPeople = 1, couponCode } = req.body;
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
    const totalOfferDiscount = Number((Number(pricing.discountAmount || 0) * peopleCount).toFixed(2));
    let totalFinalAmount = Number((Number(pricing.finalPrice || 0) * peopleCount).toFixed(2));

    // ── Coupon logic ──
    let appliedCoupon = null;
    let couponDiscountTotal = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: 'APPROVED', isActive: true });
      if (coupon) {
        const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt) >= new Date();
        const withinUsage = coupon.maxUsage === 0 || coupon.usedCount < coupon.maxUsage;
        const sameAgency = coupon.agencyId.toString() === pkg.agencyId.toString();
        const pkgMatch = coupon.applicablePackages.length === 0 || coupon.applicablePackages.some((id) => id.toString() === packageId);
        const meetsMin = coupon.minOrderAmount === 0 || pkg.price >= coupon.minOrderAmount;

        if (notExpired && withinUsage && sameAgency && pkgMatch && meetsMin) {
          let perPersonDiscount = 0;
          if (coupon.discountType === 'PERCENTAGE') {
            perPersonDiscount = (pricing.finalPrice * coupon.discountValue) / 100;
            if (coupon.maxDiscount > 0) perPersonDiscount = Math.min(perPersonDiscount, coupon.maxDiscount);
          } else {
            perPersonDiscount = coupon.discountValue;
          }
          perPersonDiscount = Math.min(perPersonDiscount, pricing.finalPrice);
          couponDiscountTotal = Number((perPersonDiscount * peopleCount).toFixed(2));
          totalFinalAmount = Number((totalFinalAmount - couponDiscountTotal).toFixed(2));
          if (totalFinalAmount < 0) totalFinalAmount = 0;
          appliedCoupon = coupon;
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const totalDiscount = Number((totalOfferDiscount + couponDiscountTotal).toFixed(2));

    const booking = await Booking.create({
      userId,
      packageId,
      travelDate,
      numberOfPeople: peopleCount,
      basePrice: totalBasePrice,
      discountApplied: totalDiscount,
      finalAmount: totalFinalAmount,
      couponId: appliedCoupon ? appliedCoupon._id : undefined,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      couponDiscount: couponDiscountTotal,
      amountMode: 'TOTAL',
      status: 'PENDING_PAYMENT'
    });

    // ── Notify agency about new booking ──
    try {
      await Notification.create({
        recipientId: pkg.agencyId,
        recipientRole: 'AGENCY',
        type: 'BOOKING_CREATED',
        title: 'New Booking!',
        message: `${req.user.name || req.user.email} booked "${pkg.title}" for ${peopleCount} people — ₹${totalFinalAmount.toLocaleString()}.`,
        referenceId: booking._id,
        referenceModel: 'Booking',
      });
    } catch (_) { /* non-critical */ }

    // ── Remove booked package from cart ──
    try {
      await Cart.updateOne(
        { userId },
        { $pull: { items: { packageId } } }
      );
    } catch (_) { /* non-critical */ }

    res.status(201).json({
      bookingId: booking._id,
      message: 'Booking created (payments disabled in this environment).',
      finalAmount: totalFinalAmount,
      perPersonAmount: pricing.finalPrice,
      couponApplied: appliedCoupon ? { code: appliedCoupon.code, discount: couponDiscountTotal } : null
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
      .populate('packageId', 'title destination category duration price imageUrl')
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
    const booking = await Booking.findById(req.params.id)
      .populate('packageId', 'title destination category duration price imageUrl agencyId')
      .populate('userId', 'name email')
      .lean();
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // Owner, admin, or agency that owns the package can view
    const isOwner = req.user && req.user.id === booking.userId._id?.toString?.() || req.user.id === booking.userId.toString();
    const isAdmin = req.user.role === 'ADMIN';
    const isAgencyOwner = req.user.role === 'AGENCY' && booking.packageId?.agencyId?.toString() === req.user.id;
    if (!isOwner && !isAdmin && !isAgencyOwner) {
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

// ── Simulate Payment (User pays — PENDING_PAYMENT → PAID) ──
exports.payBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // only booking owner or admin
    if (req.user.role !== 'ADMIN' && booking.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (booking.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({ message: `Cannot pay for booking in ${booking.status} status` });
    }

    // Simulate payment (no real payment gateway)
    booking.status = 'PAID';
    booking.paidAt = new Date();
    booking.paymentId = `SIM_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await booking.save();

    // ── Notify agency about payment received ──
    try {
      const pkg = await Package.findById(booking.packageId).select('agencyId title').lean();
      if (pkg) {
        await Notification.create({
          recipientId: pkg.agencyId,
          recipientRole: 'AGENCY',
          type: 'BOOKING_CREATED',
          title: 'Payment Received!',
          message: `Payment of ₹${booking.finalAmount.toLocaleString()} received for "${pkg.title}". Please confirm the booking.`,
          referenceId: booking._id,
          referenceModel: 'Booking',
        });
      }
    } catch (_) { /* non-critical */ }

    return res.json({ message: 'Payment simulated successfully. Awaiting agency confirmation.', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Confirm Booking (Agency confirms — PAID → CONFIRMED) ──
exports.confirmBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Only agency that owns the package or admin can confirm
    const pkg = await Package.findById(booking.packageId).select('agencyId title').lean();
    const isAgencyOwner = req.user.role === 'AGENCY' && pkg && pkg.agencyId.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAgencyOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the package agency or admin can confirm bookings.' });
    }

    if (booking.status !== 'PAID') {
      return res.status(400).json({ message: `Cannot confirm booking in ${booking.status} status. Payment must be completed first.` });
    }

    booking.status = 'CONFIRMED';
    booking.confirmedAt = new Date();
    await booking.save();

    // ── Track agency GMV and auto-upgrade tier ──
    try {
      if (pkg && pkg.agencyId) {
        await updateAgencyGMV(pkg.agencyId, booking.finalAmount);
      }
    } catch (gmvErr) {
      console.error('GMV tracking error (non-critical):', gmvErr.message);
    }

    // ── Notify user about booking confirmation ──
    try {
      await Notification.create({
        recipientId: booking.userId,
        recipientRole: 'USER',
        type: 'BOOKING_CREATED',
        title: 'Booking Confirmed!',
        message: `Your booking for "${pkg?.title || 'trip'}" has been confirmed by the agency. Get ready for your adventure!`,
        referenceId: booking._id,
        referenceModel: 'Booking',
      });
    } catch (_) { /* non-critical */ }

    return res.json({ message: 'Booking confirmed successfully.', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Complete Booking (Agency marks trip as completed — CONFIRMED → COMPLETED) ──
exports.completeBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Only agency that owns the package or admin can complete
    const pkg = await Package.findById(booking.packageId).select('agencyId title').lean();
    const isAgencyOwner = req.user.role === 'AGENCY' && pkg && pkg.agencyId.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAgencyOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the package agency or admin can mark bookings as completed.' });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ message: `Cannot complete booking in ${booking.status} status. Must be confirmed first.` });
    }

    booking.status = 'COMPLETED';
    booking.completedAt = new Date();
    await booking.save();

    // ── Notify user ──
    try {
      await Notification.create({
        recipientId: booking.userId,
        recipientRole: 'USER',
        type: 'BOOKING_CREATED',
        title: 'Trip Completed!',
        message: `Your trip "${pkg?.title || ''}" has been marked as completed. We hope you had an amazing experience! Don't forget to leave a review.`,
        referenceId: booking._id,
        referenceModel: 'Booking',
      });
    } catch (_) { /* non-critical */ }

    return res.json({ message: 'Booking marked as completed.', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Agency bookings ──
exports.getAgencyBookings = async (req, res) => {
  try {
    // Find all packages owned by this agency
    const agencyId = req.user.id;
    const packages = await Package.find({ agencyId }).select('_id').lean();
    const packageIds = packages.map((p) => p._id);

    const bookings = await Booking.find({ packageId: { $in: packageIds } })
      .sort('-createdAt')
      .populate('packageId', 'title destination category duration price imageUrl')
      .populate('userId', 'name email')
      .lean();

    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Webhook handler will be in payment controller (separate)

// ── Booking Calendar (for agencies) ──
exports.getBookingCalendar = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const { month, year } = req.query;

    const packages = await Package.find({ agencyId }).select('_id title destination duration').lean();
    const packageIds = packages.map((p) => p._id);

    // Build date range filter
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      dateFilter = { travelDate: { $gte: startDate, $lte: endDate } };
    } else {
      // Default: current month ± 2 months
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59);
      dateFilter = { travelDate: { $gte: startDate, $lte: endDate } };
    }

    const bookings = await Booking.find({
      packageId: { $in: packageIds },
      status: { $in: ['PAID', 'CONFIRMED', 'COMPLETED', 'PENDING_PAYMENT'] },
      ...dateFilter
    })
      .populate('packageId', 'title destination duration category imageUrl')
      .populate('userId', 'name email')
      .sort('travelDate')
      .lean();

    // Group by date for calendar view
    const calendarEvents = bookings.map((b) => {
      const travelDate = new Date(b.travelDate);
      const duration = b.packageId?.duration || 1;
      const endDate = new Date(travelDate.getTime() + (duration - 1) * 24 * 60 * 60 * 1000);

      return {
        id: b._id,
        title: b.packageId?.title || 'Unknown Package',
        destination: b.packageId?.destination || '',
        start: travelDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        duration,
        status: b.status,
        travelerName: b.userId?.name || 'N/A',
        travelerEmail: b.userId?.email || '',
        numberOfPeople: b.numberOfPeople,
        amount: b.finalAmount,
        category: b.packageId?.category || '',
        color: b.status === 'CONFIRMED' ? '#10b981' : b.status === 'PAID' ? '#0891b2' : b.status === 'COMPLETED' ? '#6366f1' : '#f59e0b'
      };
    });

    // Summary stats
    const dateMap = {};
    calendarEvents.forEach((ev) => {
      if (!dateMap[ev.start]) dateMap[ev.start] = { bookings: 0, travelers: 0, revenue: 0 };
      dateMap[ev.start].bookings += 1;
      dateMap[ev.start].travelers += ev.numberOfPeople;
      dateMap[ev.start].revenue += ev.amount;
    });

    res.json({
      events: calendarEvents,
      summary: dateMap,
      totalBookings: bookings.length,
      totalTravelers: bookings.reduce((s, b) => s + b.numberOfPeople, 0)
    });
  } catch (err) {
    console.error('Calendar error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
