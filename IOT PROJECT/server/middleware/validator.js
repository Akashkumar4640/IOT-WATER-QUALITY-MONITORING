/**
 * Middleware to validate and sanitize sensor reading payloads.
 * Supports explicit nulls for disconnected sensors.
 */
function validateReadingPayload(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Request body must be a valid JSON object'
      }
    });
  }

  const { deviceId, ph, temperature, tds, turbidity, ec, waterLevel } = req.body;

  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_DEVICE_ID',
        message: 'Invalid or missing "deviceId" field'
      }
    });
  }

  // Helper to validate and sanitize sensor values: finite number or null/undefined
  const sanitizeSensorValue = (val, min, max) => {
    if (val === null || val === undefined || val === '') {
      return null;
    }
    const num = Number(val);
    if (!Number.isFinite(num)) {
      return null;
    }
    if (min !== undefined && num < min) return min;
    if (max !== undefined && num > max) return max;
    return Math.round(num * 100) / 100; // 2 decimal precision
  };

  req.sanitizedReading = {
    deviceId: deviceId.trim(),
    ph: sanitizeSensorValue(ph, 0, 14),
    temperature: sanitizeSensorValue(temperature, -20, 100),
    tds: sanitizeSensorValue(tds, 0, 5000),
    turbidity: sanitizeSensorValue(turbidity, 0, 1000),
    ec: sanitizeSensorValue(ec, 0, 10000),
    waterLevel: sanitizeSensorValue(waterLevel, 0, 100),
    rawValues: typeof req.body.rawValues === 'object' ? req.body.rawValues : null,
    isSimulated: req.body.isSimulated ? 1 : 0
  };

  next();
}

module.exports = { validateReadingPayload };
