const Package = require('../models/Package');
const Booking = require('../models/Booking');

/**
 * Dynamic Pricing Engine
 * Adjusts prices based on:
 * 1. Peak season surge (configurable per destination)
 * 2. Early-bird discount (book 60+ days in advance)
 * 3. Last-minute deals (within 7 days, low bookings)
 * 4. Demand-based pricing (popularity multiplier)
 * 5. Group discounts (5+ people)
 */

// Peak season definitions by destination region
const PEAK_SEASONS = {
  // North India hill stations
  'manali': { peak: [5, 6, 10, 11, 12], surgePercent: 25 },
  'shimla': { peak: [5, 6, 10, 11, 12], surgePercent: 20 },
  'leh': { peak: [6, 7, 8, 9], surgePercent: 30 },
  'ladakh': { peak: [6, 7, 8, 9], surgePercent: 30 },
  'kashmir': { peak: [4, 5, 6, 12, 1, 2], surgePercent: 25 },
  // Beach destinations
  'goa': { peak: [11, 12, 1, 2, 3], surgePercent: 30 },
  'andaman': { peak: [11, 12, 1, 2, 3], surgePercent: 20 },
  'kerala': { peak: [10, 11, 12, 1, 2], surgePercent: 20 },
  // Rajasthan
  'rajasthan': { peak: [10, 11, 12, 1, 2, 3], surgePercent: 20 },
  'jaipur': { peak: [10, 11, 12, 1, 2, 3], surgePercent: 15 },
  'udaipur': { peak: [10, 11, 12, 1, 2, 3], surgePercent: 20 },
  // International
  'dubai': { peak: [11, 12, 1, 2, 3], surgePercent: 25 },
  'bali': { peak: [6, 7, 8, 12], surgePercent: 20 },
  'thailand': { peak: [11, 12, 1, 2, 3], surgePercent: 20 },
  'maldives': { peak: [12, 1, 2, 3, 4], surgePercent: 35 },
  'europe': { peak: [6, 7, 8, 9], surgePercent: 25 },
  'singapore': { peak: [6, 7, 12], surgePercent: 15 }
};

const PRICING_CONFIG = {
  earlyBird: {
    daysThreshold: 60,  // Book 60+ days before travel
    discountPercent: 10
  },
  superEarlyBird: {
    daysThreshold: 90,
    discountPercent: 15
  },
  lastMinute: {
    daysThreshold: 7,
    discountPercent: 15, // Up to 15% off if demand is low
    minOccupancyForDiscount: 0.3 // Only apply if less than 30% booked
  },
  groupDiscount: {
    minPeople: 5,
    discountPercent: 8,
    largeGroupMin: 10,
    largeGroupDiscountPercent: 12
  },
  demandMultiplier: {
    highDemandThreshold: 10, // bookings in last 7 days
    highDemandSurge: 10      // 10% surge
  }
};

/**
 * Compute dynamic price adjustments for a package
 */
async function computeDynamicPrice({ packageId, basePrice, travelDate, numberOfPeople = 1 }) {
  const adjustments = [];
  let adjustedPrice = basePrice;

  const pkg = typeof packageId === 'object' ? packageId : await Package.findById(packageId).lean();
  if (!pkg) return { adjustedPrice: basePrice, adjustments: [], finalPrice: basePrice };

  const tDate = travelDate ? new Date(travelDate) : null;
  const now = new Date();

  // 1. Peak Season Surge
  if (tDate) {
    const month = tDate.getMonth() + 1;
    const destLower = (pkg.destination || '').toLowerCase();
    
    // Check exact match or partial match
    for (const [dest, config] of Object.entries(PEAK_SEASONS)) {
      if (destLower.includes(dest) && config.peak.includes(month)) {
        const surgeAmount = basePrice * (config.surgePercent / 100);
        adjustments.push({
          type: 'PEAK_SEASON_SURGE',
          label: `Peak season (${dest})`,
          percent: config.surgePercent,
          amount: surgeAmount,
          direction: 'up'
        });
        adjustedPrice += surgeAmount;
        break;
      }
    }
  }

  // 2. Early Bird / Super Early Bird Discount
  if (tDate) {
    const daysUntilTravel = Math.ceil((tDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilTravel >= PRICING_CONFIG.superEarlyBird.daysThreshold) {
      const discount = basePrice * (PRICING_CONFIG.superEarlyBird.discountPercent / 100);
      adjustments.push({
        type: 'SUPER_EARLY_BIRD',
        label: `Super early bird (${daysUntilTravel} days ahead)`,
        percent: PRICING_CONFIG.superEarlyBird.discountPercent,
        amount: discount,
        direction: 'down'
      });
      adjustedPrice -= discount;
    } else if (daysUntilTravel >= PRICING_CONFIG.earlyBird.daysThreshold) {
      const discount = basePrice * (PRICING_CONFIG.earlyBird.discountPercent / 100);
      adjustments.push({
        type: 'EARLY_BIRD',
        label: `Early bird (${daysUntilTravel} days ahead)`,
        percent: PRICING_CONFIG.earlyBird.discountPercent,
        amount: discount,
        direction: 'down'
      });
      adjustedPrice -= discount;
    }

    // 3. Last Minute Deals
    if (daysUntilTravel > 0 && daysUntilTravel <= PRICING_CONFIG.lastMinute.daysThreshold) {
      // Check demand — if few bookings for this date range, offer discount
      const recentBookings = await Booking.countDocuments({
        packageId: pkg._id,
        travelDate: {
          $gte: new Date(tDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          $lte: new Date(tDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        },
        status: { $nin: ['CANCELLED', 'REFUNDED'] }
      });

      if (recentBookings < 3) { // Low demand
        const discount = basePrice * (PRICING_CONFIG.lastMinute.discountPercent / 100);
        adjustments.push({
          type: 'LAST_MINUTE_DEAL',
          label: 'Last minute deal',
          percent: PRICING_CONFIG.lastMinute.discountPercent,
          amount: discount,
          direction: 'down'
        });
        adjustedPrice -= discount;
      }
    }
  }

  // 4. Demand-based pricing (high demand surge)
  const recentDemand = await Booking.countDocuments({
    packageId: pkg._id,
    createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    status: { $nin: ['CANCELLED', 'REFUNDED'] }
  });

  if (recentDemand >= PRICING_CONFIG.demandMultiplier.highDemandThreshold) {
    const surgeAmount = basePrice * (PRICING_CONFIG.demandMultiplier.highDemandSurge / 100);
    adjustments.push({
      type: 'HIGH_DEMAND',
      label: 'Popular package – high demand',
      percent: PRICING_CONFIG.demandMultiplier.highDemandSurge,
      amount: surgeAmount,
      direction: 'up'
    });
    adjustedPrice += surgeAmount;
  }

  // 5. Group Discount
  const peopleCount = parseInt(numberOfPeople) || 1;
  if (peopleCount >= PRICING_CONFIG.groupDiscount.largeGroupMin) {
    const discount = basePrice * (PRICING_CONFIG.groupDiscount.largeGroupDiscountPercent / 100);
    adjustments.push({
      type: 'LARGE_GROUP_DISCOUNT',
      label: `Large group (${peopleCount} people)`,
      percent: PRICING_CONFIG.groupDiscount.largeGroupDiscountPercent,
      amount: discount,
      direction: 'down'
    });
    adjustedPrice -= discount;
  } else if (peopleCount >= PRICING_CONFIG.groupDiscount.minPeople) {
    const discount = basePrice * (PRICING_CONFIG.groupDiscount.discountPercent / 100);
    adjustments.push({
      type: 'GROUP_DISCOUNT',
      label: `Group discount (${peopleCount} people)`,
      percent: PRICING_CONFIG.groupDiscount.discountPercent,
      amount: discount,
      direction: 'down'
    });
    adjustedPrice -= discount;
  }

  // Floor at zero
  adjustedPrice = Math.max(0, Number(adjustedPrice.toFixed(2)));

  return {
    basePrice,
    adjustedPrice,
    adjustments,
    totalSurge: adjustments.filter((a) => a.direction === 'up').reduce((s, a) => s + a.amount, 0),
    totalDiscount: adjustments.filter((a) => a.direction === 'down').reduce((s, a) => s + a.amount, 0),
    finalPrice: adjustedPrice
  };
}

// GET endpoint handler
async function getDynamicPricing(req, res) {
  try {
    const { packageId, travelDate, numberOfPeople } = req.query;
    if (!packageId) return res.status(400).json({ message: 'packageId is required' });

    const pkg = await Package.findById(packageId).lean();
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    const pricing = await computeDynamicPrice({
      packageId: pkg,
      basePrice: pkg.price,
      travelDate,
      numberOfPeople: numberOfPeople || 1
    });

    res.json({ pricing, config: PRICING_CONFIG });
  } catch (err) {
    console.error('Dynamic pricing error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  computeDynamicPrice,
  getDynamicPricing,
  PRICING_CONFIG,
  PEAK_SEASONS
};
