const Agency = require('../models/Agency');
const { getBookingTotalAmount } = require('./bookingAmountService');

// Map tiers to commission percentages
const TIER_RATES = {
  STANDARD: 8, // default
  SILVER: 6,
  GOLD: 4,
  PLATINUM: 2
};

async function getCommissionPercentForAgency(agencyId) {
  if (!agencyId) return TIER_RATES.STANDARD;
  const agency = await Agency.findById(agencyId).lean();
  if (!agency) return TIER_RATES.STANDARD;
  const tier = (agency.commissionTier || 'STANDARD').toUpperCase();
  return TIER_RATES[tier] ?? TIER_RATES.STANDARD;
}

async function computeCommissionForBooking(booking) {
  const percent = await getCommissionPercentForAgency(booking.agencyId || booking.packageAgencyId);
  const totalAmount = getBookingTotalAmount(booking);
  const commission = Number(((totalAmount * percent) / 100).toFixed(2));
  return { percent, commission };
}

module.exports = { getCommissionPercentForAgency, computeCommissionForBooking };
