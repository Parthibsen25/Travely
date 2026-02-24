const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Payout = require('../models/Payout');
const Agency = require('../models/Agency');
const {
  computeCommissionForBooking,
  getTierConfig,
  MIN_PAYOUT_THRESHOLD,
} = require('./commissionService');

// ──────────────────────────────────────────────────────────────
// Real-world Payout Service
//
// Settlement cycle:
//   1. Trip must be completed (travelDate + duration days)
//   2. Wait for settlement window (T+7 or T+14 based on tier)
//   3. Booking must not be disputed
//   4. Group eligible bookings by agency
//   5. Compute full financial breakdown per payout
//   6. Only create payout if net amount >= MIN_PAYOUT_THRESHOLD
// ──────────────────────────────────────────────────────────────

/**
 * Find bookings eligible for payout settlement
 */
async function findEligibleBookings() {
  const now = new Date();

  const bookings = await Booking.find({
    status: { $in: ['CONFIRMED', 'COMPLETED'] },
    payoutId: { $exists: false },
  }).lean();

  const eligible = [];

  for (const b of bookings) {
    const pkg = await Package.findById(b.packageId).lean();
    if (!pkg) continue;

    const agencyId = pkg.agencyId;
    if (!agencyId) continue;

    const agency = await Agency.findById(agencyId).lean();
    const tierConfig = getTierConfig(agency?.commissionTier);
    const settlementDays = tierConfig.settlementCycle === 'T+14' ? 14 : 7;

    const duration = pkg.duration || 1;
    const travelDate = new Date(b.travelDate);
    const tripEnd = new Date(travelDate.getTime() + duration * 24 * 60 * 60 * 1000);
    const releaseDate = new Date(tripEnd.getTime() + settlementDays * 24 * 60 * 60 * 1000);

    if (now >= releaseDate) {
      eligible.push({
        ...b,
        agencyId,
        settlementCycle: tierConfig.settlementCycle,
        commissionRate: tierConfig.rate,
      });
    }
  }

  return eligible;
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return 'INV-' + y + m + d + '-' + rand;
}

/**
 * Create payout records for all eligible bookings
 */
async function createPayoutsForEligibleBookings() {
  const eligible = await findEligibleBookings();
  if (!eligible.length) return [];

  // Group by agency
  const groups = eligible.reduce((acc, b) => {
    const key = b.agencyId.toString();
    (acc[key] = acc[key] || []).push(b);
    return acc;
  }, {});

  const created = [];

  for (const agencyId of Object.keys(groups)) {
    const list = groups[agencyId];

    let grossAmount = 0;
    let totalPlatformCommission = 0;
    let totalGstOnCommission = 0;
    let totalTds = 0;
    let totalGatewayFee = 0;
    const bookingIds = [];
    let commissionRate = 0;
    let settlementCycle = 'T+7';

    for (const b of list) {
      const breakdown = await computeCommissionForBooking({
        finalAmount: b.finalAmount,
        numberOfPeople: b.numberOfPeople,
        amountMode: b.amountMode,
        agencyId,
      });

      grossAmount += breakdown.grossAmount;
      totalPlatformCommission += breakdown.platformCommission;
      totalGstOnCommission += breakdown.gstOnCommission;
      totalTds += breakdown.tds;
      totalGatewayFee += breakdown.gatewayFee;
      commissionRate = breakdown.percent;
      bookingIds.push(b._id);
      settlementCycle = b.settlementCycle || 'T+7';
    }

    grossAmount = Number(grossAmount.toFixed(2));
    totalPlatformCommission = Number(totalPlatformCommission.toFixed(2));
    totalGstOnCommission = Number(totalGstOnCommission.toFixed(2));
    totalTds = Number(totalTds.toFixed(2));
    totalGatewayFee = Number(totalGatewayFee.toFixed(2));

    const totalDeductions = Number(
      (totalPlatformCommission + totalGstOnCommission + totalTds + totalGatewayFee).toFixed(2)
    );
    const netPayoutAmount = Number((grossAmount - totalDeductions).toFixed(2));

    // Skip if below minimum payout threshold
    if (netPayoutAmount < MIN_PAYOUT_THRESHOLD) continue;

    const payout = await Payout.create({
      agencyId,
      bookingIds,
      grossAmount,
      platformCommission: totalPlatformCommission,
      commissionRate,
      gstOnCommission: totalGstOnCommission,
      tdsDeducted: totalTds,
      paymentGatewayFee: totalGatewayFee,
      totalDeductions,
      netPayoutAmount,
      // Legacy compat
      totalRevenue: grossAmount,
      commissionDeducted: totalDeductions,
      payoutAmount: netPayoutAmount,
      settlementCycle,
      scheduledDate: new Date(),
      status: 'SCHEDULED',
      invoiceNumber: generateInvoiceNumber(),
    });

    await Booking.updateMany(
      { _id: { $in: bookingIds } },
      { $set: { payoutId: payout._id, status: 'COMPLETED' } }
    );
    created.push(payout);
  }

  return created;
}

module.exports = { findEligibleBookings, createPayoutsForEligibleBookings };
