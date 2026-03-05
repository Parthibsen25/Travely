const Agency = require('../models/Agency');

// Helper: extract total amount from a booking object
function getBookingTotalAmount(booking) {
  return booking.finalAmount || 0;
}

// ────────────────────────────────────────────────────────────────────────
// Real-world OTA Commission Structure
// Based on industry standards (MakeMyTrip, Booking.com, Goibibo, etc.)
// ────────────────────────────────────────────────────────────────────────

// Commission tiers based on quarterly GMV (Gross Merchandise Value)
// Higher GMV = lower commission (volume incentive)
const TIER_CONFIG = {
  STARTER: {
    rate: 20,                   // 20% — New agencies, < ₹5L quarterly GMV
    label: 'Starter',
    minQuarterlyGMV: 0,
    maxQuarterlyGMV: 500000,
    settlementCycle: 'T+14',    // 14-day settlement for new agencies
    description: 'New partner — building trust',
  },
  GROWTH: {
    rate: 18,                   // 18% — ₹5L – ₹25L quarterly GMV
    label: 'Growth',
    minQuarterlyGMV: 500000,
    maxQuarterlyGMV: 2500000,
    settlementCycle: 'T+7',
    description: 'Growing partner — standard terms',
  },
  PROFESSIONAL: {
    rate: 15,                   // 15% — ₹25L – ₹1Cr quarterly GMV
    label: 'Professional',
    minQuarterlyGMV: 2500000,
    maxQuarterlyGMV: 10000000,
    settlementCycle: 'T+7',
    description: 'High-volume partner — preferred rates',
  },
  ENTERPRISE: {
    rate: 12,                   // 12% — > ₹1Cr quarterly GMV
    label: 'Enterprise',
    minQuarterlyGMV: 10000000,
    maxQuarterlyGMV: Infinity,
    settlementCycle: 'T+7',
    description: 'Elite partner — best rates',
  },
};

// Additional deductions applied on every payout
const DEDUCTION_RATES = {
  TDS_PERCENT: 1,              // TDS @ 1% on GMV — Section 194-O (E-commerce operator)
  GST_ON_COMMISSION: 18,       // 18% GST charged on the commission amount
  PAYMENT_GATEWAY_PERCENT: 2,  // ~2% payment gateway processing fee
};

// Minimum payout threshold — payouts below this are held until next cycle
const MIN_PAYOUT_THRESHOLD = 500; // ₹500

/**
 * Get the commission tier config for an agency
 */
function getTierConfig(tier) {
  const key = (tier || 'STARTER').toUpperCase();
  return TIER_CONFIG[key] || TIER_CONFIG.STARTER;
}

/**
 * Determine tier based on quarterly GMV
 */
function determineTierByGMV(quarterlyGMV) {
  if (quarterlyGMV >= TIER_CONFIG.ENTERPRISE.minQuarterlyGMV) return 'ENTERPRISE';
  if (quarterlyGMV >= TIER_CONFIG.PROFESSIONAL.minQuarterlyGMV) return 'PROFESSIONAL';
  if (quarterlyGMV >= TIER_CONFIG.GROWTH.minQuarterlyGMV) return 'GROWTH';
  return 'STARTER';
}

/**
 * Get commission percentage for an agency
 */
async function getCommissionPercentForAgency(agencyId) {
  if (!agencyId) return TIER_CONFIG.STARTER.rate;
  const agency = await Agency.findById(agencyId).lean();
  if (!agency) return TIER_CONFIG.STARTER.rate;
  const config = getTierConfig(agency.commissionTier);
  return config.rate;
}

/**
 * Compute full financial breakdown for a booking
 */
async function computeCommissionForBooking(booking) {
  const agencyId = booking.agencyId || booking.packageAgencyId;
  const percent = await getCommissionPercentForAgency(agencyId);
  const totalAmount = getBookingTotalAmount(booking);

  const platformCommission = Number(((totalAmount * percent) / 100).toFixed(2));
  const gstOnCommission = Number(((platformCommission * DEDUCTION_RATES.GST_ON_COMMISSION) / 100).toFixed(2));
  const tds = Number(((totalAmount * DEDUCTION_RATES.TDS_PERCENT) / 100).toFixed(2));
  const gatewayFee = Number(((totalAmount * DEDUCTION_RATES.PAYMENT_GATEWAY_PERCENT) / 100).toFixed(2));

  const totalDeductions = Number((platformCommission + gstOnCommission + tds + gatewayFee).toFixed(2));
  const netPayout = Number((totalAmount - totalDeductions).toFixed(2));

  return {
    percent,
    commission: platformCommission,        // backward compat
    platformCommission,
    gstOnCommission,
    tds,
    gatewayFee,
    totalDeductions,
    netPayout,
    grossAmount: totalAmount,
  };
}

/**
 * Auto-upgrade agency tier based on quarterly GMV
 */
async function checkAndUpgradeTier(agencyId) {
  const agency = await Agency.findById(agencyId);
  if (!agency) return null;

  // Reset quarterly GMV if quarter changed
  const now = new Date();
  const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (!agency.quarterlyGMVResetAt || agency.quarterlyGMVResetAt < currentQuarterStart) {
    agency.quarterlyGMV = 0;
    agency.quarterlyGMVResetAt = currentQuarterStart;
  }

  const newTier = determineTierByGMV(agency.quarterlyGMV);
  if (newTier !== agency.commissionTier) {
    agency.commissionTier = newTier;
    await agency.save();
    return { upgraded: true, oldTier: agency.commissionTier, newTier };
  }
  return { upgraded: false, currentTier: agency.commissionTier };
}

/**
 * Update agency GMV after a confirmed booking
 */
async function updateAgencyGMV(agencyId, bookingAmount) {
  const agency = await Agency.findById(agencyId);
  if (!agency) return;

  // Reset quarterly GMV if quarter changed
  const now = new Date();
  const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (!agency.quarterlyGMVResetAt || agency.quarterlyGMVResetAt < currentQuarterStart) {
    agency.quarterlyGMV = 0;
    agency.quarterlyGMVResetAt = currentQuarterStart;
  }

  agency.quarterlyGMV += bookingAmount;
  agency.lifetimeGMV += bookingAmount;
  await agency.save();

  // Check for auto tier upgrade
  await checkAndUpgradeTier(agencyId);
}

module.exports = {
  TIER_CONFIG,
  DEDUCTION_RATES,
  MIN_PAYOUT_THRESHOLD,
  getTierConfig,
  determineTierByGMV,
  getCommissionPercentForAgency,
  computeCommissionForBooking,
  checkAndUpgradeTier,
  updateAgencyGMV,
};
