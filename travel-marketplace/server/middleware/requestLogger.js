const morgan = require('morgan');
const logger = require('../utils/logger');

// stream to winston
const stream = { write: (message) => logger.info(message.trim()) };

const requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms', { stream });

module.exports = requestLogger;
