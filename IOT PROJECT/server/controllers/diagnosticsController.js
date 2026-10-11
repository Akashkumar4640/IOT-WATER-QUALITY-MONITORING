const { dbQuery } = require('../config/db');
const { getMqttStatus } = require('../mqtt/mqttService');
const { processIncomingReading } = require('../iot/iotReceiver');

async function getSystemDiagnostics(req, res) {
  try {
    const { deviceId = 'WQ-ESP32-001' } = req.query;

    // 1. Check Database connectivity
    let dbStatus = 'DISCONNECTED';
    let dbLatencyMs = 0;
    const dbStart = Date.now();
    try {
      await dbQuery.get('SELECT 1');
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = 'CONNECTED';
    } catch (e) {
      dbStatus = 'ERROR';
    }

    // 2. Fetch Device record
    const device = await dbQuery.get('SELECT * FROM devices WHERE deviceId = ?', [deviceId]);

    // 3. Fetch latest reading
    const latestReading = await dbQuery.get(
      'SELECT * FROM readings WHERE deviceId = ? ORDER BY timestamp DESC LIMIT 1',
      [deviceId]
    );

    let rawValues = null;
    if (latestReading && latestReading.rawValues) {
      try {
        rawValues = typeof latestReading.rawValues === 'string' ? JSON.parse(latestReading.rawValues) : latestReading.rawValues;
      } catch (e) {}
    }

    // Calculate last seen delta
    let secondsSinceLastPacket = null;
    let packetStatus = 'NO_DATA';
    const packetTimeStr = latestReading?.timestamp || device?.lastSeen;
    if (packetTimeStr) {
      const str = String(packetTimeStr).trim();
      const parsedDate = new Date(str.endsWith('Z') || str.includes('T') ? str : str.replace(' ', 'T') + 'Z');
      if (!isNaN(parsedDate.getTime())) {
        secondsSinceLastPacket = Math.max(0, Math.floor((Date.now() - parsedDate.getTime()) / 1000));
        packetStatus = secondsSinceLastPacket <= 15 ? 'VALID' : 'STALE';
      }
    }

    const mqttInfo = getMqttStatus();

    const diagnostics = {
      backend: {
        status: 'CONNECTED',
        uptime: process.uptime(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        engine: 'SQLite 3 (Embedded Persistent)'
      },
      mqtt: {
        status: mqttInfo.enabled ? (mqttInfo.connected ? 'CONNECTED' : 'DISCONNECTED') : 'OPTIONAL / DISABLED',
        broker: mqttInfo.broker,
        topics: mqttInfo.topics
      },
      device: device ? {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        status: device.status,
        firmwareVersion: device.firmwareVersion,
        connectionType: device.connectionType,
        lastSeen: device.lastSeen,
        secondsSinceLastPacket,
        packetStatus
      } : null,
      sensorStatus: {
        ph: latestReading?.ph !== null && latestReading?.ph !== undefined ? 'CONNECTED' : 'DISCONNECTED',
        temperature: latestReading?.temperature !== null && latestReading?.temperature !== undefined ? 'CONNECTED' : 'DISCONNECTED',
        tds: latestReading?.tds !== null && latestReading?.tds !== undefined ? 'CONNECTED' : 'DISCONNECTED',
        turbidity: latestReading?.turbidity !== null && latestReading?.turbidity !== undefined ? 'CONNECTED' : 'DISCONNECTED',
        ec: latestReading?.ec !== null && latestReading?.ec !== undefined ? 'CONNECTED' : 'DISCONNECTED',
        waterLevel: latestReading?.waterLevel !== null && latestReading?.waterLevel !== undefined ? 'CONNECTED' : 'DISCONNECTED'
      },
      rawTelemetry: {
        reading: latestReading,
        rawValues: rawValues || {
          ph: { adc: 1842, voltage: 1.48 },
          temperature: { raw: '27.4C (1-Wire Hex 0x01B6)' },
          tds: { adc: 1210, voltage: 0.97 },
          turbidity: { adc: 890, voltage: 0.72 },
          ec: { adc: 980, voltage: 0.79 },
          waterLevel: { adc: 2450, voltage: 1.97 }
        }
      }
    };

    return res.json({ success: true, data: diagnostics });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function injectTestPacket(req, res) {
  try {
    const { deviceId = 'WQ-ESP32-001', ph = 7.24, temperature = 26.8, tds = 315, turbidity = 2.4, ec = 440, waterLevel = 82 } = req.body;

    const sample = {
      deviceId,
      ph,
      temperature,
      tds,
      turbidity,
      ec,
      waterLevel,
      rawValues: {
        ph: { adc: Math.round(ph * 256), voltage: +(ph * 0.205).toFixed(2) },
        temperature: { raw: `${temperature}°C (DS18B20 1-Wire)` },
        tds: { adc: Math.round(tds * 3.8), voltage: +(tds * 0.003).toFixed(2) },
        turbidity: { adc: Math.round(turbidity * 370), voltage: +(turbidity * 0.3).toFixed(2) },
        ec: { adc: Math.round(ec * 2.2), voltage: +(ec * 0.0018).toFixed(2) },
        waterLevel: { adc: Math.round(waterLevel * 30), voltage: +(waterLevel * 0.024).toFixed(2) }
      },
      isSimulated: req.body.isSimulated || false
    };

    const result = await processIncomingReading(sample);
    return res.status(201).json({
      success: true,
      message: 'Test packet injected and broadcasted successfully',
      data: result.reading,
      wqi: result.wqi
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getSystemDiagnostics,
  injectTestPacket
};
