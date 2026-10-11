const { Logger, ResponseHelper } = require('../utils');

function errorHandler(err, req, res, next) {
  Logger.error('HTTP', err.stack || err.message);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500 
    ? 'An unexpected server error occurred' 
    : (err.message || 'Internal Server Error');

  ResponseHelper.error(res, message, status, err.code || 'INTERNAL_ERROR', err.details || null);
}

module.exports = errorHandler;
