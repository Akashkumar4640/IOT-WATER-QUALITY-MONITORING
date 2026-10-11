const { dbQuery } = require('../config/db');
const { getIO } = require('../websocket/socketManager');

function safeJsonParse(val, fallback = {}) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

async function saveCalibration(req, res) {
  try {
    const { deviceId, sensor, calibrationParameters, referenceValues } = req.body;

    if (!deviceId || !sensor || !calibrationParameters) {
      return res.status(400).json({
        success: false,
        error: 'Missing required calibration parameters (deviceId, sensor, calibrationParameters)'
      });
    }

    const paramsJson = typeof calibrationParameters === 'object' ? JSON.stringify(calibrationParameters) : calibrationParameters;
    const refJson = typeof referenceValues === 'object' ? JSON.stringify(referenceValues) : (referenceValues || '{}');

    // UPSERT calibration record
    await dbQuery.run(`
      INSERT INTO calibrations (deviceId, sensor, calibrationParameters, referenceValues, calibrationDate, status)
      VALUES (?, ?, ?, ?, datetime('now'), 'ACTIVE')
      ON CONFLICT(deviceId, sensor) DO UPDATE SET
        calibrationParameters = excluded.calibrationParameters,
        referenceValues = excluded.referenceValues,
        calibrationDate = datetime('now'),
        status = 'ACTIVE'
    `, [deviceId, sensor, paramsJson, refJson]);

    const savedRecord = await dbQuery.get(
      'SELECT * FROM calibrations WHERE deviceId = ? AND sensor = ?',
      [deviceId, sensor]
    );

    const io = getIO();
    if (io) {
      io.emit('calibration_updated', {
        deviceId,
        sensor,
        calibration: savedRecord
      });
    }

    return res.status(200).json({
      success: true,
      message: `Calibration profile for ${sensor} saved and activated successfully on ${deviceId}.`,
      data: {
        ...savedRecord,
        calibrationParameters: safeJsonParse(savedRecord.calibrationParameters, {}),
        referenceValues: safeJsonParse(savedRecord.referenceValues, {})
      }
    });
  } catch (err) {
    console.error('[Calibration Controller] Error saving calibration:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getCalibration(req, res) {
  try {
    const { deviceId } = req.params;
    const calibrations = await dbQuery.all(
      'SELECT * FROM calibrations WHERE deviceId = ? ORDER BY sensor ASC',
      [deviceId]
    );

    const parsed = calibrations.map(c => ({
      ...c,
      calibrationParameters: safeJsonParse(c.calibrationParameters, {}),
      referenceValues: safeJsonParse(c.referenceValues, {})
    }));

    return res.json({
      success: true,
      deviceId,
      data: parsed
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function resetCalibration(req, res) {
  try {
    const { deviceId, sensor } = req.params;
    const result = await dbQuery.run(
      'DELETE FROM calibrations WHERE deviceId = ? AND sensor = ?',
      [deviceId, sensor]
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Calibration record not found' });
    }

    const io = getIO();
    if (io) {
      io.emit('calibration_reset', { deviceId, sensor });
    }

    return res.json({
      success: true,
      message: `Calibration for ${sensor} has been reset to factory defaults.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  saveCalibration,
  getCalibration,
  resetCalibration
};
