const crypto = require('crypto');
const Booking = require('../models/Booking');

// Razorpay webhook verification
exports.razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const shasum = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
    const signature = req.headers['x-razorpay-signature'];

    if (shasum !== signature) {
      console.warn('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload || {};

    if (event === 'payment.captured' || event === 'payment.authorized') {
      const payment = payload.payment ? payload.payment.entity : null;
      if (!payment) return res.status(400).json({ message: 'Missing payment entity' });

      const orderId = payment.order_id;
      const paymentId = payment.id;
      const amount = payment.amount; // in paise

      const booking = await Booking.findOne({ paymentOrderId: orderId });
      if (!booking) {
        console.warn('Booking not found for order', orderId);
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Update booking to CONFIRMED only after verifying capture
      booking.status = 'CONFIRMED';
      booking.paymentId = paymentId;
      await booking.save();

      return res.json({ ok: true });
    }

    // Other events can be handled as needed
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
