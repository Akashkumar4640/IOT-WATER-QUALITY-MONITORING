const { dbQuery } = require('../config/db');

async function getDevices(req, res) {
  try {
    const devices = await dbQuery.all('SELECT * FROM devices ORDER BY createdAt DESC');
    return res.json({ success: true, count: devices.length, data: devices });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getDeviceStatus(req, res) {
  try {
    const { deviceId } = req.params;
    const device = await dbQuery.get('SELECT * FROM devices WHERE deviceId = ?', [deviceId]);

    if (!device) {
      return res.status(404).json({ success: false, error: `Device ${deviceId} not found` });
    }

    // Get latest reading to count connected sensors
    const latestReading = await dbQuery.get(
      'SELECT * FROM readings WHERE deviceId = ? ORDER BY timestamp DESC LIMIT 1',
      [deviceId]
    );

    let sensorsConnected = 0;
    const totalSensors = 5; // pH, Temp, TDS, Turbidity, EC
    const sensorDetails = {
      ph: false,
      temperature: false,
      tds: false,
      turbidity: false,
      ec: false,
      waterLevel: false
    };

    if (latestReading) {
      if (latestReading.ph !== null) { sensorsConnected++; sensorDetails.ph = true; }
      if (latestReading.temperature !== null) { sensorsConnected++; sensorDetails.temperature = true; }
      if (latestReading.tds !== null) { sensorsConnected++; sensorDetails.tds = true; }
      if (latestReading.turbidity !== null) { sensorsConnected++; sensorDetails.turbidity = true; }
      if (latestReading.ec !== null) { sensorsConnected++; sensorDetails.ec = true; }
      if (latestReading.waterLevel !== null) { sensorDetails.waterLevel = true; }
    }

    return res.json({
      success: true,
      data: {
        ...device,
        sensorsConnected,
        totalSensors,
        sensorDetails,
        latestReading
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function registerDevice(req, res) {
  try {
    const { deviceId, deviceName, deviceToken, firmwareVersion, connectionType } = req.body;

    if (!deviceId || !deviceName) {
      return res.status(400).json({ success: false, error: 'deviceId and deviceName are required' });
    }

    const token = deviceToken || `wq-tok-${Math.random().toString(36).substring(2, 10)}`;

    await dbQuery.run(`
      INSERT INTO devices (deviceId, deviceName, deviceToken, status, firmwareVersion, connectionType, lastSeen)
      VALUES (?, ?, ?, 'OFFLINE', ?, ?, datetime('now'))
    `, [deviceId.trim(), deviceName.trim(), token, firmwareVersion || '1.0.0', connectionType || 'Wi-Fi']);

    const newDevice = await dbQuery.get('SELECT * FROM devices WHERE deviceId = ?', [deviceId.trim()]);
    return res.status(201).json({ success: true, message: 'Device registered successfully', data: newDevice });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, error: `Device ID '${req.body.deviceId}' already exists` });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function updateDevice(req, res) {
  try {
    const { deviceId } = req.params;
    const { deviceName, deviceToken, firmwareVersion, connectionType } = req.body;

    const device = await dbQuery.get('SELECT * FROM devices WHERE deviceId = ?', [deviceId]);
    if (!device) {
      return res.status(404).json({ success: false, error: `Device ${deviceId} not found` });
    }

    await dbQuery.run(`
      UPDATE devices
      SET deviceName = COALESCE(?, deviceName),
          deviceToken = COALESCE(?, deviceToken),
          firmwareVersion = COALESCE(?, firmwareVersion),
          connectionType = COALESCE(?, connectionType),
          updatedAt = datetime('now')
      WHERE deviceId = ?
    `, [deviceName, deviceToken, firmwareVersion, connectionType, deviceId]);

    const updated = await dbQuery.get('SELECT * FROM devices WHERE deviceId = ?', [deviceId]);
    return res.json({ success: true, message: 'Device updated successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function deleteDevice(req, res) {
  try {
    const { deviceId } = req.params;
    await dbQuery.run('DELETE FROM readings WHERE deviceId = ?', [deviceId]);
    await dbQuery.run('DELETE FROM alerts WHERE deviceId = ?', [deviceId]);
    await dbQuery.run('DELETE FROM calibrations WHERE deviceId = ?', [deviceId]);
    const result = await dbQuery.run('DELETE FROM devices WHERE deviceId = ?', [deviceId]);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: `Device ${deviceId} not found` });
    }

    return res.json({ success: true, message: `Device ${deviceId} and associated records deleted.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDevices,
  getDeviceStatus,
  registerDevice,
  updateDevice,
  deleteDevice
};
