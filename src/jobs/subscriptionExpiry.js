const cron = require('node-cron');
const { expireOverdue } = require('../modules/subscriptions/subscriptions.service');
const logger = require('../utils/logger');

function startSubscriptionExpiryJob() {
  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const count = await expireOverdue();
      if (count > 0) {
        logger.info(`Subscription expiry job: expired ${count} subscriptions`);
      }
    } catch (err) {
      logger.error('Subscription expiry job failed', { message: err.message });
    }
  });

  logger.info('Subscription expiry job scheduled (runs every hour)');
}

module.exports = { startSubscriptionExpiryJob };
