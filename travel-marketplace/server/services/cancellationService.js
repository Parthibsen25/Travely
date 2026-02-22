const Package = require('../models/Package');
const { getCommissionPercentForAgency } = require('./commissionService');
const { getBookingTotalAmount } = require('./bookingAmountService');

/**
 * Compute cancellation refund details for a booking.
 * - booking: booking document (must include travelDate, finalAmount, packageId, numberOfPeople)
 * - currentDate: Date or ISO string
 * Returns: { daysBeforeTravel, applicableSlab, refundableAmount, commissionPercent, commissionAdjustment }
 */
async function computeCancellation({ booking, currentDate = new Date() }) {
  const now = new Date(currentDate);
  const travelDate = new Date(booking.travelDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = travelDate.getTime() - now.getTime();
  const daysBeforeTravel = Math.ceil(diff / msPerDay);

  // load package cancellation policy
  const pkg = await Package.findById(booking.packageId).lean();
  const policy = (pkg && pkg.cancellationPolicy) || [];

  // find the slab with smallest beforeDays >= daysBeforeTravel? We interpret "beforeDays" as threshold
  // We'll choose the slab with beforeDays >= daysBeforeTravel and highest beforeDays among matches
  let applicable = null;
  for (const slab of policy) {
    // slab.daysBefore or slab.beforeDays naming: support both
    const before = slab.beforeDays ?? slab.daysBefore ?? 0;
    if (daysBeforeTravel >= before) {
      if (!applicable || before > (applicable.beforeDays ?? applicable.daysBefore ?? 0)) {
        applicable = { ...slab, beforeDays: before };
      }
    }
  }

  // If none matched, fallback to 0% refund
  const refundPercent = (applicable && (applicable.refundPercent ?? 0)) || 0;

  const gross = getBookingTotalAmount(booking);
  const refundableAmount = Number(((gross * refundPercent) / 100).toFixed(2));

  // commission adjustment: commission percent for agency; when refund happens platform may reduce agency payout by
  // commission share on refunded amount. Compute commission amount on refundableAmount.
  const commissionPercent = await getCommissionPercentForAgency(booking.agencyId || pkg.agencyId);
  const commissionAdjustment = Number(((refundableAmount * commissionPercent) / 100).toFixed(2));

  return {
    daysBeforeTravel,
    applicableSlab: applicable,
    refundableAmount,
    commissionPercent,
    commissionAdjustment
  };
}

module.exports = { computeCancellation };
