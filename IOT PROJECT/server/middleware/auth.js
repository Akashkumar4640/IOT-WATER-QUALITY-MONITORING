const { dbQuery } = require('../config/db');

/**
 * Authenticates incoming device telemetry requests.
 * Checks for X-Device-Id and X-Device-Token headers or body properties.
 */
async function authenticateDevice(req, res, next) {
  try {
    const deviceId = req.headers['x-device-id'] || req.body.deviceId;
    const deviceToken = req.headers['x-device-token'] || req.headers['authorization']?.replace('Bearer ', '') || req.body.deviceToken;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing deviceId in headers or payload'
      });
    }

    // Lookup device in database
    const device = await dbQuery.get('SELECT * FROM devices WHERE deviceId = ?', [deviceId]);

    if (!device) {
      return res.status(401).json({
        success: false,
        error: `Device '${deviceId}' is not registered in the system`
      });
    }

    // Verify token if configured
    if (device.deviceToken && deviceToken && device.deviceToken !== deviceToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid device credentials / token'
      });
    }

    req.device = device;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during device authentication' });
  }
}

module.exports = { authenticateDevice };
