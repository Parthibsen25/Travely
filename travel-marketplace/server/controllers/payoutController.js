const Payout = require('../models/Payout');

exports.getMyPayouts = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const payouts = await Payout.find({ agencyId }).sort('-createdAt');
    res.json({ payouts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
