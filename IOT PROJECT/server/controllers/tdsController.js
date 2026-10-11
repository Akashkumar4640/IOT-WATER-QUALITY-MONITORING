const { dbQuery } = require('../config/db');
const { evaluateTDS } = require('../services/tdsEvaluator');
const { getIO } = require('../websocket/socketManager');

// In-memory tracker for simulation state
let currentSimulatedTDS = 185.0;

// ============================================================================
// Real-time Prototype In-Memory TDS Storage for NodeMCU ESP8266
// ============================================================================
// NOTE REGARDING SERVERLESS DEPLOYMENT (e.g. VERCEL):
// This variable stores only the single latest real sensor reading in memory.
// It resets whenever the Node.js server restarts or upon a Vercel serverless
// function cold restart / redeploy. A persistent database (e.g. SQLite, PostgreSQL,
// Supabase, or MongoDB) is needed for permanent historical data and multi-instance persistence.
let latestRealTdsReading = null;

const EXPECTED_DEVICE_KEY = 'tds-demo-2026';

/**
 * Validate and ingest real-time TDS telemetry directly from ESP8266 NodeMCU.
 * Endpoint: POST /api/tds
 * Accepts JSON:
 * {
 *   "tds_ppm": 32,
 *   "raw_adc": 23.4,
 *   "status": "Normal TDS Range",
 *   "device_key": "tds-demo-2026"
 * }
 */
async function postDirectTdsReading(req, res) {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. JSON object expected.'
      });
    }

    const { tds_ppm, raw_adc, status, device_key } = body;

    // Requirement: Reject requests where device_key is not "tds-demo-2026" using HTTP 401
    if (device_key !== EXPECTED_DEVICE_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or missing device_key'
      });
    }

    // Validation: validate tds_ppm and raw_adc are numbers and status is a string
    const isNumeric = (val) => {
      if (val === null || val === undefined || val === '') return false;
      if (typeof val === 'number') return !isNaN(val) && isFinite(val);
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '') return false;
        const num = Number(trimmed);
        return !isNaN(num) && isFinite(num);
      }
      return false;
    };

    if (!isNumeric(tds_ppm)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error: "tds_ppm" must be a valid numeric value.'
      });
    }

    if (!isNumeric(raw_adc)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error: "raw_adc" must be a valid numeric value.'
      });
    }

    if (typeof status !== 'string' || status.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error: "status" must be a non-empty string.'
      });
    }

    const parsedTds = Number(tds_ppm);
    const parsedRawAdc = Number(raw_adc);
    const parsedStatus = status.trim();
    const updatedAt = new Date().toISOString();

    // Store only the latest reading in memory for this prototype
    latestRealTdsReading = {
      tds_ppm: parsedTds,
      raw_adc: parsedRawAdc,
      status: parsedStatus,
      updatedAt
    };

    // Broadcast in real-time to active WebSocket clients if available
    try {
      const io = getIO();
      if (io) {
        io.emit('tds_direct_reading', latestRealTdsReading);
      }
    } catch (wsErr) {
      // Non-fatal if socket is uninitialized
    }

    // Return HTTP 200 JSON: { "success": true, "message": "TDS reading received" }
    return res.status(200).json({
      success: true,
      message: 'TDS reading received'
    });
  } catch (err) {
    console.error('[TDS Controller] Error processing POST /api/tds:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Returns the latest received real sensor reading from in-memory store.
 * Endpoint: GET /api/tds
 * Returns:
 * {
 *   "tds_ppm": 32,
 *   "raw_adc": 23.4,
 *   "status": "Normal TDS Range",
 *   "updatedAt": "2026-10-11T..."
 * }
 * or waiting response if no reading has arrived yet:
 * {
 *   "message": "Waiting for sensor data"
 * }
 */
function getDirectTdsReading(req, res) {
  if (!latestRealTdsReading) {
    return res.status(200).json({
      message: 'Waiting for sensor data'
    });
  }

  return res.status(200).json({
    tds_ppm: latestRealTdsReading.tds_ppm,
    raw_adc: latestRealTdsReading.raw_adc,
    status: latestRealTdsReading.status,
    updatedAt: latestRealTdsReading.updatedAt
  });
}

/**
 * Ingest TDS Telemetry from ESP8266 NodeMCU or simulator
 * Endpoint: POST /api/tds/telemetry (or POST /api/tds/reading)
 */
async function postTDSTelemetry(req, res) {
  try {
    const body = req.body || {};
    const query = req.query || {};

    const rawTds = body.tds !== undefined ? body.tds : query.tds;
    if (rawTds === undefined || rawTds === null || rawTds === '') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "tds" (numeric value in ppm)'
      });
    }

    const tds = parseFloat(rawTds);
    if (isNaN(tds)) {
      return res.status(400).json({
        success: false,
        error: 'Field "tds" must be a valid number'
      });
    }

    const deviceId = body.deviceId || query.deviceId || 'NODEMCU-TDS-01';
    const voltage = body.voltage !== undefined ? parseFloat(body.voltage) : (body.rawAdc ? +(body.rawAdc * 3.3 / 1024).toFixed(3) : +(tds / 450).toFixed(3));
    const temperature = body.temperature !== undefined ? parseFloat(body.temperature) : 25.0;
    const rawAdc = body.rawAdc !== undefined ? parseInt(body.rawAdc) : Math.round(voltage * 1024 / 3.3);
    const notes = body.notes || 'ESP8266 NodeMCU Telemetry';

    // Apply strict project TDS Decision Logic
    const evaluation = evaluateTDS(tds);
    const timestamp = new Date().toISOString();

    // 1. Update device status in DB
    await dbQuery.run(`
      INSERT INTO devices (deviceId, deviceName, deviceToken, status, firmwareVersion, connectionType, lastSeen)
      VALUES (?, ?, ?, 'ONLINE', '1.2.0-TDS', 'Wi-Fi (NodeMCU 802.11b/g/n)', ?)
      ON CONFLICT(deviceId) DO UPDATE SET
        status = 'ONLINE',
        lastSeen = excluded.lastSeen,
        updatedAt = excluded.lastSeen
    `, [deviceId, `ESP8266 NodeMCU (${deviceId})`, 'nodemcu-sec-token-tds-01', timestamp]);

    // 2. Insert into dedicated tds_readings table
    const result = await dbQuery.run(`
      INSERT INTO tds_readings (deviceId, timestamp, tds, voltage, temperature, rawAdc, statusCode, statusLabel, likelyComponents, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      deviceId,
      timestamp,
      evaluation.tds,
      voltage,
      temperature,
      rawAdc,
      evaluation.statusCode,
      evaluation.statusLabel,
      evaluation.likelyComponents,
      notes
    ]);

    // 3. Also update main readings table so general dashboard / analytics see the TDS reading
    await dbQuery.run(`
      INSERT INTO readings (deviceId, timestamp, tds, temperature, ec, isSimulated, validationStatus)
      VALUES (?, ?, ?, ?, ?, ?, 'VALID')
    `, [
      deviceId,
      timestamp,
      evaluation.tds,
      temperature,
      Math.round(evaluation.tds * 1.45),
      body.isSimulated ? 1 : 0
    ]);

    const readingPayload = {
      id: result.id,
      deviceId,
      timestamp,
      voltage,
      temperature,
      rawAdc,
      ...evaluation
    };

    // Update in-memory tracker
    currentSimulatedTDS = evaluation.tds;

    // 4. Broadcast in real time via Socket.IO
    const io = getIO();
    if (io) {
      io.emit('tds_reading', readingPayload);
      io.emit('sensor_reading', {
        deviceId,
        timestamp,
        tds: evaluation.tds,
        temperature,
        ec: Math.round(evaluation.tds * 1.45),
        rawValues: { voltage, rawAdc }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'TDS Telemetry ingested successfully',
      data: readingPayload
    });
  } catch (err) {
    console.error('[TDS Controller] Error processing TDS telemetry:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get the latest TDS reading with full drinkability assessment
 * Endpoint: GET /api/tds/latest
 */
async function getLatestTDS(req, res) {
  try {
    const deviceId = req.query.deviceId;
    let query = 'SELECT * FROM tds_readings';
    let params = [];

    if (deviceId) {
      query += ' WHERE deviceId = ?';
      params.push(deviceId);
    }
    query += ' ORDER BY timestamp DESC LIMIT 1';

    let record = await dbQuery.get(query, params);

    // If no dedicated TDS record yet, look at general readings
    if (!record) {
      const generalReading = await dbQuery.get('SELECT * FROM readings WHERE tds IS NOT NULL ORDER BY timestamp DESC LIMIT 1');
      if (generalReading) {
        record = {
          deviceId: generalReading.deviceId,
          timestamp: generalReading.timestamp,
          tds: generalReading.tds,
          temperature: generalReading.temperature || 25.0,
          voltage: +(generalReading.tds / 450).toFixed(3),
          rawAdc: Math.round((generalReading.tds / 450) * 1024 / 3.3)
        };
      }
    }

    // Default baseline if completely empty
    if (!record) {
      record = {
        deviceId: 'NODEMCU-TDS-01',
        timestamp: new Date().toISOString(),
        tds: 185.0,
        temperature: 24.5,
        voltage: 1.15,
        rawAdc: 357
      };
    }

    const evaluation = evaluateTDS(record.tds);

    return res.json({
      success: true,
      data: {
        id: record.id || 0,
        deviceId: record.deviceId,
        timestamp: record.timestamp,
        voltage: record.voltage,
        temperature: record.temperature,
        rawAdc: record.rawAdc,
        ...evaluation
      }
    });
  } catch (err) {
    console.error('[TDS Controller] Error fetching latest TDS:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get historical TDS readings with statistics and distribution
 * Endpoint: GET /api/tds/history
 */
async function getTDSHistory(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const deviceId = req.query.deviceId;

    let query = 'SELECT * FROM tds_readings';
    let params = [];

    if (deviceId) {
      query += ' WHERE deviceId = ?';
      params.push(deviceId);
    }
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    let rows = await dbQuery.all(query, params);

    // If empty, fetch from readings table
    if (!rows || rows.length === 0) {
      const generalRows = await dbQuery.all(`
        SELECT id, deviceId, timestamp, tds, temperature
        FROM readings 
        WHERE tds IS NOT NULL 
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [limit]);

      rows = generalRows.map(r => ({
        id: r.id,
        deviceId: r.deviceId,
        timestamp: r.timestamp,
        tds: r.tds,
        temperature: r.temperature || 25.0,
        voltage: +(r.tds / 450).toFixed(3),
        rawAdc: Math.round((r.tds / 450) * 1024 / 3.3)
      }));
    }

    // Sort ascending for chronological trend charts
    const chronological = [...rows].reverse().map(r => {
      const evalData = evaluateTDS(r.tds);
      return {
        id: r.id,
        deviceId: r.deviceId,
        timestamp: r.timestamp,
        tds: r.tds,
        voltage: r.voltage,
        temperature: r.temperature,
        statusCode: evalData.statusCode,
        statusLabel: evalData.statusLabel,
        color: evalData.color,
        likelyComponents: evalData.likelyComponents
      };
    });

    // Compute stats
    const tdsValues = chronological.map(r => r.tds).filter(v => v !== null && !isNaN(v));
    const stats = {
      totalReadings: tdsValues.length,
      current: tdsValues.length > 0 ? tdsValues[tdsValues.length - 1] : 0,
      min: tdsValues.length > 0 ? Math.min(...tdsValues) : 0,
      max: tdsValues.length > 0 ? Math.max(...tdsValues) : 0,
      avg: tdsValues.length > 0 ? +(tdsValues.reduce((a, b) => a + b, 0) / tdsValues.length).toFixed(1) : 0,
      drinkableCount: chronological.filter(r => r.statusCode === 'DRINKABLE').length,
      cautionCount: chronological.filter(r => r.statusCode === 'CAUTION').length,
      unsafeCount: chronological.filter(r => r.statusCode === 'UNSAFE').length
    };

    return res.json({
      success: true,
      stats,
      data: chronological
    });
  } catch (err) {
    console.error('[TDS Controller] Error fetching TDS history:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Interactive Simulation / Salt Addition Endpoint
 * Allows testing salt addition and status changes dynamically in real time
 * Endpoint: POST /api/tds/simulate-salt
 */
async function simulateSalt(req, res) {
  try {
    const { action = 'add_salt', amount = 120, preset, deviceId = 'NODEMCU-TDS-01' } = req.body || {};

    let targetTds = currentSimulatedTDS;

    if (preset) {
      switch (preset) {
        case 'clean':
        case 'drinkable':
          targetTds = 160.0;
          break;
        case 'mineral':
          targetTds = 275.0;
          break;
        case 'caution':
        case 'high':
          targetTds = 395.0;
          break;
        case 'saline':
        case 'unsafe':
          targetTds = 680.0;
          break;
        case 'severe':
          targetTds = 920.0;
          break;
        default:
          targetTds = 180.0;
      }
    } else if (action === 'reset') {
      targetTds = 155.0;
    } else if (action === 'add_salt') {
      const increment = parseFloat(amount) || 100;
      targetTds = Math.min(1200, currentSimulatedTDS + increment);
    } else if (action === 'dilute') {
      const decrement = parseFloat(amount) || 100;
      targetTds = Math.max(30, currentSimulatedTDS - decrement);
    }

    currentSimulatedTDS = targetTds;

    // Simulate NodeMCU telemetry ingestion
    req.body = {
      deviceId,
      tds: targetTds,
      temperature: 25.2,
      voltage: +(targetTds / 450).toFixed(3),
      notes: `Salt Simulation [${action}] Amount: ${amount || 0}`,
      isSimulated: true
    };

    return postTDSTelemetry(req, res);
  } catch (err) {
    console.error('[TDS Controller] Error in simulate-salt:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  postDirectTdsReading,
  getDirectTdsReading,
  postTDSTelemetry,
  getLatestTDS,
  getTDSHistory,
  simulateSalt
};
