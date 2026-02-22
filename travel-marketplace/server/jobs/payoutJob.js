const cron = require('node-cron');
const { createPayoutsForEligibleBookings } = require('../services/payoutService');

function startPayoutJob() {
  // run daily at 02:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Running payout job...');
      const created = await createPayoutsForEligibleBookings();
      console.log('Payouts created:', created.length);
    } catch (err) {
      console.error('Payout job error', err);
    }
  });
}

module.exports = { startPayoutJob };
