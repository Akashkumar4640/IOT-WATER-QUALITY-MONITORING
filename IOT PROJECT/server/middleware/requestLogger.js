const { Logger } = require('../utils');

function requestLogger(req, res, next) {
  if (req.path.startsWith('/api/')) {
    Logger.info('HTTP', `${req.method} ${req.path}`);
  }
  next();
}

module.exports = requestLogger;
