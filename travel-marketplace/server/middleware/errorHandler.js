const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled error: %o', err);
  const isMulterSizeError = err?.name === 'MulterError' && err?.code === 'LIMIT_FILE_SIZE';
  const status = isMulterSizeError ? 400 : err.status || 500;
  const message = isMulterSizeError ? 'Image must be 5MB or smaller' : err.message || 'Internal Server Error';
  
  // In development, send more error details
  const response = {
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
      name: err.name
    })
  };
  
  res.status(status).json(response);
}

module.exports = errorHandler;
