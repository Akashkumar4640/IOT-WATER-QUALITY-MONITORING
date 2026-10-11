const { dbQuery } = require('../config/db');
const { processIncomingReading } = require('../iot/iotReceiver');
const { calculateWQI } = require('../services/wqiCalculator');

async function postReadings(req, res) {
  try {
    const readingData = req.sanitizedReading;
    const result = await processIncomingReading(readingData);

    return res.status(201).json({
      success: true,
      message: 'Telemetry received and processed successfully',
      data: result.reading,
      wqi: result.wqi
    });
  } catch (err) {
    console.error('[IoT Controller] Error handling reading:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getLatestReading(req, res) {
  try {
    const { deviceId } = req.params;
    const reading = await dbQuery.get(
      'SELECT * FROM readings WHERE deviceId = ? ORDER BY timestamp DESC LIMIT 1',
      [deviceId]
    );

    if (!reading) {
      return res.status(404).json({
        success: false,
        error: `No telemetry found for device ${deviceId}`
      });
    }

    if (reading.rawValues && typeof reading.rawValues === 'string') {
      try {
        reading.rawValues = JSON.parse(reading.rawValues);
      } catch (e) {}
    }

    const wqi = calculateWQI(reading);

    return res.json({
      success: true,
      data: reading,
      wqi
    });
  } catch (err) {
    console.error('[IoT Controller] Error getting latest reading:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getHistory(req, res) {
  try {
    const { deviceId } = req.params;
    const { range = '1h', limit = 100 } = req.query;

    let timeModifier = "-1 hour";
    if (range === '5m') timeModifier = "-5 minutes";
    else if (range === '30m') timeModifier = "-30 minutes";
    else if (range === '1h') timeModifier = "-1 hour";
    else if (range === '24h' || range === 'today') timeModifier = "-24 hours";
    else if (range === '7d') timeModifier = "-7 days";
    else if (range === '30d') timeModifier = "-30 days";

    const readings = await dbQuery.all(`
      SELECT * FROM readings 
      WHERE deviceId = ? AND timestamp >= datetime('now', ?)
      ORDER BY timestamp ASC
      LIMIT ?
    `, [deviceId, timeModifier, parseInt(limit)]);

    const parsedReadings = readings.map(r => {
      let raw = null;
      if (r.rawValues) {
        try { raw = JSON.parse(r.rawValues); } catch(e) {}
      }
      return { ...r, rawValues: raw };
    });

    // Compute summary stats
    const stats = {
      ph: calculateStats(parsedReadings.map(r => r.ph)),
      temperature: calculateStats(parsedReadings.map(r => r.temperature)),
      tds: calculateStats(parsedReadings.map(r => r.tds)),
      turbidity: calculateStats(parsedReadings.map(r => r.turbidity)),
      ec: calculateStats(parsedReadings.map(r => r.ec)),
      waterLevel: calculateStats(parsedReadings.map(r => r.waterLevel)),
      totalReadings: parsedReadings.length
    };

    return res.json({
      success: true,
      range,
      stats,
      data: parsedReadings
    });
  } catch (err) {
    console.error('[IoT Controller] Error getting history:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

function calculateStats(values) {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return { min: null, max: null, avg: null, count: 0 };

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const sum = valid.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / valid.length) * 100) / 100;

  return { min, max, avg, count: valid.length };
}

module.exports = {
  postReadings,
  getLatestReading,
  getHistory
};
