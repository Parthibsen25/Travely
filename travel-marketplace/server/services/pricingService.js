/**
 * Compute final price based on basePrice, travelDate and available offers.
 * Rules:
 * - Only offers valid for the travel date are considered
 * - No stacking: choose the single offer that gives the highest discount amount
 * - Returns finalPrice, discountAmount, appliedOfferDetails (null if none)
 */

function isOfferValidForDate(offer, travelDate) {
  if (!travelDate) {
    // if no travel date provided, consider current date
    travelDate = new Date();
  }
  if (offer.validFrom && travelDate < new Date(offer.validFrom)) return false;
  if (offer.validTo && travelDate > new Date(offer.validTo)) return false;
  return true;
}

function computeDiscountAmount(offer, basePrice) {
  if (!offer) return 0;
  if (offer.discountType === 'PERCENTAGE') {
    return (basePrice * (Number(offer.value) / 100));
  }
  // FIXED
  return Number(offer.value);
}

function clampPrice(price) {
  if (price < 0) return 0;
  return Number(Number(price).toFixed(2));
}

async function computeFinalPrice({ basePrice, travelDate, availableOffers = [] }) {
  const tDate = travelDate ? new Date(travelDate) : new Date();
  const applicable = [];

  for (const o of availableOffers) {
    // basePrice must meet minPrice if set
    if (o.minPrice && basePrice < o.minPrice) continue;
    // date checks
    if (!isOfferValidForDate(o, tDate)) continue;
    applicable.push(o);
  }

  let best = null;
  let bestDiscount = 0;

  for (const o of applicable) {
    const discount = computeDiscountAmount(o, basePrice);
    if (discount > bestDiscount) {
      bestDiscount = discount;
      best = o;
    }
  }

  const discountAmount = Math.min(bestDiscount, basePrice);
  const finalPrice = clampPrice(basePrice - discountAmount);

  const appliedOfferDetails = best
    ? {
        id: best._id || best.id || null,
        title: best.title,
        discountType: best.discountType,
        value: best.value,
        validFrom: best.validFrom || null,
        validTo: best.validTo || null,
        minPrice: best.minPrice || null,
        destination: best.destination || null,
        packageId: best.packageId || null
      }
    : null;

  return {
    finalPrice,
    discountAmount: Number(discountAmount.toFixed(2)),
    appliedOfferDetails
  };
}

module.exports = {
  computeFinalPrice
};
