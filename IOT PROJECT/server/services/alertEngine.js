const { dbQuery } = require('../config/db');

// In-memory active anomaly tracking for deduplication: key -> { id, severity, value, message, timestamp }
const activeAlertState = new Map();

/**
 * Evaluates reading against thresholds and handles alert generation/deduplication/resolution.
 */
async function processReadingAlerts(deviceId, reading, io = null) {
  try {
    // 1. Fetch current threshold settings
    const settingsRow = await dbQuery.get('SELECT value FROM settings WHERE key = ?', ['thresholds']);
    const thresholds = settingsRow ? JSON.parse(settingsRow.value) : {
      ph: { min: 6.5, max: 8.5, criticalMin: 5.5, criticalMax: 9.5 },
      temperature: { min: 10.0, max: 35.0, criticalMin: 5.0, criticalMax: 45.0 },
      tds: { warning: 300, max: 500, criticalMax: 1000 },
      turbidity: { warning: 5.0, max: 10.0, criticalMax: 25.0 },
      ec: { warning: 500, max: 800, criticalMax: 1500 },
      waterLevel: { min: 20, max: 95 }
    };

    const checks = [];

    // --- pH Checks ---
    if (reading.ph !== null && reading.ph !== undefined) {
      if (reading.ph < thresholds.ph.criticalMin || reading.ph > thresholds.ph.criticalMax) {
        checks.push({
          sensor: 'pH',
          value: reading.ph,
          threshold: `< ${thresholds.ph.criticalMin} or > ${thresholds.ph.criticalMax}`,
          severity: 'CRITICAL',
          message: `Critical abnormal pH detected (${reading.ph}). Configured safe range is ${thresholds.ph.min} - ${thresholds.ph.max}.`
        });
      } else if (reading.ph < thresholds.ph.min || reading.ph > thresholds.ph.max) {
        checks.push({
          sensor: 'pH',
          value: reading.ph,
          threshold: `${thresholds.ph.min} - ${thresholds.ph.max}`,
          severity: 'WARNING',
          message: `Abnormal pH level (${reading.ph}) outside optimal range (${thresholds.ph.min} - ${thresholds.ph.max}).`
        });
      }
    }

    // --- Temperature Checks ---
    if (reading.temperature !== null && reading.temperature !== undefined) {
      if (reading.temperature < thresholds.temperature.criticalMin || reading.temperature > thresholds.temperature.criticalMax) {
        checks.push({
          sensor: 'Temperature',
          value: reading.temperature,
          threshold: `${thresholds.temperature.criticalMin} - ${thresholds.temperature.criticalMax} °C`,
          severity: 'CRITICAL',
          message: `Extreme temperature detected (${reading.temperature} °C).`
        });
      } else if (reading.temperature < thresholds.temperature.min || reading.temperature > thresholds.temperature.max) {
        checks.push({
          sensor: 'Temperature',
          value: reading.temperature,
          threshold: `${thresholds.temperature.min} - ${thresholds.temperature.max} °C`,
          severity: 'WARNING',
          message: `Water temperature (${reading.temperature} °C) is outside normal operating range.`
        });
      }
    }

    // --- TDS Checks ---
    if (reading.tds !== null && reading.tds !== undefined) {
      if (reading.tds > thresholds.tds.criticalMax) {
        checks.push({
          sensor: 'TDS',
          value: reading.tds,
          threshold: `> ${thresholds.tds.criticalMax} ppm`,
          severity: 'CRITICAL',
          message: `High Total Dissolved Solids (${reading.tds} ppm) critically exceeding threshold.`
        });
      } else if (reading.tds > thresholds.tds.warning) {
        checks.push({
          sensor: 'TDS',
          value: reading.tds,
          threshold: `> ${thresholds.tds.warning} ppm`,
          severity: 'WARNING',
          message: `TDS level (${reading.tds} ppm) elevated, approaching upper threshold.`
        });
      }
    }

    // --- Turbidity Checks ---
    if (reading.turbidity !== null && reading.turbidity !== undefined) {
      if (reading.turbidity > thresholds.turbidity.criticalMax) {
        checks.push({
          sensor: 'Turbidity',
          value: reading.turbidity,
          threshold: `> ${thresholds.turbidity.criticalMax} NTU`,
          severity: 'CRITICAL',
          message: `High Turbidity (${reading.turbidity} NTU) indicates heavy particulate matter.`
        });
      } else if (reading.turbidity > thresholds.turbidity.warning) {
        checks.push({
          sensor: 'Turbidity',
          value: reading.turbidity,
          threshold: `> ${thresholds.turbidity.warning} NTU`,
          severity: 'WARNING',
          message: `Turbidity level (${reading.turbidity} NTU) elevated above normal clarity limits.`
        });
      }
    }

    // --- EC Checks ---
    if (reading.ec !== null && reading.ec !== undefined) {
      if (reading.ec > thresholds.ec.criticalMax) {
        checks.push({
          sensor: 'EC',
          value: reading.ec,
          threshold: `> ${thresholds.ec.criticalMax} µS/cm`,
          severity: 'CRITICAL',
          message: `Electrical Conductivity (${reading.ec} µS/cm) severely elevated.`
        });
      } else if (reading.ec > thresholds.ec.warning) {
        checks.push({
          sensor: 'EC',
          value: reading.ec,
          threshold: `> ${thresholds.ec.warning} µS/cm`,
          severity: 'WARNING',
          message: `Electrical Conductivity (${reading.ec} µS/cm) exceeding target limit.`
        });
      }
    }

    // --- Water Level Checks ---
    if (reading.waterLevel !== null && reading.waterLevel !== undefined) {
      if (reading.waterLevel < thresholds.waterLevel.min) {
        checks.push({
          sensor: 'Water Level',
          value: reading.waterLevel,
          threshold: `< ${thresholds.waterLevel.min} %`,
          severity: 'WARNING',
          message: `Water tank level low (${reading.waterLevel}%). Sensor submergence may be compromised.`
        });
      }
    }

    // List of evaluated sensors in this reading
    const monitoredSensors = ['pH', 'Temperature', 'TDS', 'Turbidity', 'EC', 'Water Level'];

    // Process each triggered condition
    for (const check of checks) {
      const stateKey = `${deviceId}:${check.sensor}`;
      const existing = activeAlertState.get(stateKey);

      if (!existing || existing.severity !== check.severity) {
        // Condition is new or severity changed -> insert alert into DB
        const result = await dbQuery.run(`
          INSERT INTO alerts (deviceId, sensor, value, threshold, severity, message, timestamp, resolved)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 0)
        `, [deviceId, check.sensor, check.value, check.threshold, check.severity, check.message]);

        const alertPayload = {
          id: result.id,
          deviceId,
          sensor: check.sensor,
          value: check.value,
          threshold: check.threshold,
          severity: check.severity,
          message: check.message,
          timestamp: new Date().toISOString(),
          resolved: 0
        };

        activeAlertState.set(stateKey, alertPayload);

        // Broadcast alert event over websocket
        if (io) {
          io.emit('new_alert', alertPayload);
        }
      }
    }

    // Auto-resolve any sensors that are now normal
    const triggeredSensorNames = new Set(checks.map(c => c.sensor));
    for (const sensorName of monitoredSensors) {
      const stateKey = `${deviceId}:${sensorName}`;
      if (activeAlertState.has(stateKey) && !triggeredSensorNames.has(sensorName)) {
        // Condition cleared!
        const existing = activeAlertState.get(stateKey);
        await dbQuery.run(`
          UPDATE alerts 
          SET resolved = 1, resolvedAt = datetime('now') 
          WHERE deviceId = ? AND sensor = ? AND resolved = 0
        `, [deviceId, sensorName]);

        const resolvedPayload = {
          deviceId,
          sensor: sensorName,
          severity: 'RESOLVED',
          message: `${sensorName} measurement returned to normal configured range.`,
          resolvedAt: new Date().toISOString()
        };

        activeAlertState.delete(stateKey);

        if (io) {
          io.emit('alert_resolved', resolvedPayload);
        }
      }
    }
  } catch (err) {
    console.error('[Alert Engine] Error processing reading alerts:', err);
  }
}

/**
 * Generates or clears hardware/connection alerts (offline / reconnected).
 */
async function handleDeviceConnectionState(deviceId, isOnline, io = null) {
  const stateKey = `${deviceId}:CONNECTION`;
  const existing = activeAlertState.get(stateKey);

  if (!isOnline && !existing) {
    const result = await dbQuery.run(`
      INSERT INTO alerts (deviceId, sensor, value, threshold, severity, message, timestamp, resolved)
      VALUES (?, 'Device', 0, 'Ping Timeout', 'CONNECTION', 'Hardware connection lost. ESP32 is offline.', datetime('now'), 0)
    `, [deviceId]);

    const alertPayload = {
      id: result.id,
      deviceId,
      sensor: 'Device',
      value: 0,
      threshold: 'Ping Timeout',
      severity: 'CONNECTION',
      message: 'Hardware connection lost. ESP32 is offline.',
      timestamp: new Date().toISOString(),
      resolved: 0
    };
    activeAlertState.set(stateKey, alertPayload);
    if (io) io.emit('new_alert', alertPayload);
  } else if (isOnline && existing) {
    await dbQuery.run(`
      UPDATE alerts 
      SET resolved = 1, resolvedAt = datetime('now') 
      WHERE deviceId = ? AND sensor = 'Device' AND resolved = 0
    `, [deviceId]);

    activeAlertState.delete(stateKey);
    if (io) {
      io.emit('alert_resolved', {
        deviceId,
        sensor: 'Device',
        severity: 'RESOLVED',
        message: 'Hardware reconnected successfully.',
        resolvedAt: new Date().toISOString()
      });
    }
  }
}

module.exports = {
  processReadingAlerts,
  handleDeviceConnectionState
};
