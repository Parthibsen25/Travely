const { getSupportedCurrencies, convertFromINR } = require('../services/currencyService');
const User = require('../models/User');

// GET /api/currency/supported — list all supported currencies
exports.listCurrencies = async (req, res) => {
  try {
    res.json({ currencies: getSupportedCurrencies() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/currency/convert — convert amount
exports.convert = async (req, res) => {
  try {
    const { amount, to } = req.body;
    if (!amount || !to) {
      return res.status(400).json({ message: 'amount and to (currency code) are required' });
    }

    const result = await convertFromINR(Number(amount), to.toUpperCase());
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/currency/preference — save user preferred currency
exports.setPreference = async (req, res) => {
  try {
    const { currency } = req.body;
    if (!currency) return res.status(400).json({ message: 'Currency code is required' });

    const supported = getSupportedCurrencies().map((c) => c.code);
    if (!supported.includes(currency.toUpperCase())) {
      return res.status(400).json({ message: 'Unsupported currency' });
    }

    await User.findByIdAndUpdate(req.user.id, { preferredCurrency: currency.toUpperCase() });
    res.json({ message: 'Currency preference updated', currency: currency.toUpperCase() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
