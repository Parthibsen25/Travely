const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Payout = require('../models/Payout');
const { computeCommissionForBooking } = require('./commissionService');
const { getBookingTotalAmount } = require('./bookingAmountService');

/**
 * Find bookings eligible for payout:
 * - status CONFIRMED
 * - not disputed
 * - not already assigned to a payout
 * - trip end date + 48 hours <= now
 */
async function findEligibleBookings() {
  const now = new Date();
  // find confirmed bookings
  const bookings = await Booking.find({ status: 'CONFIRMED', payoutId: { $exists: false } }).lean();
  const eligible = [];
  for (const b of bookings) {
    const pkg = await Package.findById(b.packageId).lean();
    if (!pkg) continue;
    const duration = pkg.duration || 1;
    const travelDate = new Date(b.travelDate);
    const tripEnd = new Date(travelDate.getTime() + (duration * 24 * 60 * 60 * 1000));
    const releaseDate = new Date(tripEnd.getTime() + (48 * 60 * 60 * 1000));
    if (now >= releaseDate && b.status !== 'DISPUTED') {
      // attach agencyId for grouping
      eligible.push({ ...b, agencyId: pkg.agencyId || b.agencyId });
    }
  }
  return eligible;
}

async function createPayoutsForEligibleBookings() {
  const eligible = await findEligibleBookings();
  if (!eligible.length) return [];

  // group by agencyId
  const groups = eligible.reduce((acc, b) => {
    const key = b.agencyId.toString();
    (acc[key] = acc[key] || []).push(b);
    return acc;
  }, {});

  const created = [];
  for (const agencyId of Object.keys(groups)) {
    const list = groups[agencyId];
    let totalRevenue = 0;
    let commissionDeducted = 0;
    const bookingIds = [];

    for (const b of list) {
      const bookingTotalAmount = getBookingTotalAmount(b);
      totalRevenue += bookingTotalAmount;
      const { commission } = await computeCommissionForBooking({
        finalAmount: b.finalAmount,
        numberOfPeople: b.numberOfPeople,
        amountMode: b.amountMode,
        agencyId
      });
      commissionDeducted += commission;
      bookingIds.push(b._id);
    }

    totalRevenue = Number(totalRevenue.toFixed(2));
    commissionDeducted = Number(commissionDeducted.toFixed(2));
    const payoutAmount = Number((totalRevenue - commissionDeducted).toFixed(2));

    const payout = await Payout.create({ agencyId, bookingIds, totalRevenue, commissionDeducted, payoutAmount, status: 'PENDING', payoutDate: new Date() });

    // mark bookings with payoutId
    await Booking.updateMany({ _id: { $in: bookingIds } }, { $set: { payoutId: payout._id } });

    created.push(payout);
  }

  return created;
}

module.exports = {
  findEligibleBookings,
  createPayoutsForEligibleBookings
};
