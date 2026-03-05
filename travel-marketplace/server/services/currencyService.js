const logger = require('../utils/logger');

// Supported currencies with symbols and static fallback rates (relative to INR)
const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee', rate: 1 },
  USD: { symbol: '$', name: 'US Dollar', rate: 0.012 },
  EUR: { symbol: '€', name: 'Euro', rate: 0.011 },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.0095 },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', rate: 0.044 },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', rate: 0.016 },
  THB: { symbol: '฿', name: 'Thai Baht', rate: 0.42 },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', rate: 0.056 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', rate: 0.018 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', rate: 0.016 },
  JPY: { symbol: '¥', name: 'Japanese Yen', rate: 1.79 }
};

let cachedRates = null;
let lastFetchedAt = null;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// Fetch live rates from a free API (no API key needed)
async function fetchLiveRates() {
  try {
    // Only fetch if cache is expired
    if (cachedRates && lastFetchedAt && Date.now() - lastFetchedAt < CACHE_DURATION) {
      return cachedRates;
    }

    const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
    if (!response.ok) throw new Error(`Exchange rate API returned ${response.status}`);

    const data = await response.json();
    cachedRates = data.rates;
    lastFetchedAt = Date.now();
    logger.info('Exchange rates updated successfully');
    return cachedRates;
  } catch (err) {
    logger.warn(`Failed to fetch live rates: ${err.message}. Using fallback rates.`);
    return null;
  }
}

// Convert amount from INR to target currency
async function convertFromINR(amountINR, targetCurrency) {
  if (!targetCurrency || targetCurrency === 'INR') {
    return { amount: amountINR, currency: 'INR', symbol: '₹', rate: 1 };
  }

  const currencyInfo = CURRENCIES[targetCurrency];
  if (!currencyInfo) {
    return { amount: amountINR, currency: 'INR', symbol: '₹', rate: 1 };
  }

  let rate = currencyInfo.rate; // fallback

  // Try live rates
  const liveRates = await fetchLiveRates();
  if (liveRates && liveRates[targetCurrency]) {
    rate = liveRates[targetCurrency];
  }

  const convertedAmount = Number((amountINR * rate).toFixed(2));

  return {
    amount: convertedAmount,
    currency: targetCurrency,
    symbol: currencyInfo.symbol,
    rate,
    originalINR: amountINR
  };
}

// Get all supported currencies
function getSupportedCurrencies() {
  return Object.entries(CURRENCIES).map(([code, info]) => ({
    code,
    symbol: info.symbol,
    name: info.name
  }));
}

module.exports = {
  CURRENCIES,
  convertFromINR,
  getSupportedCurrencies,
  fetchLiveRates
};
