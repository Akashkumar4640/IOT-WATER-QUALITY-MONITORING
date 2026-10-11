const { dbQuery } = require('../config/db');
const { calculateWQI } = require('../services/wqiCalculator');
const { processReadingAlerts, handleDeviceConnectionState } = require('../services/alertEngine');
const { broadcastTelemetry, broadcastDeviceStatus, getIO } = require('../websocket/socketManager');

/**
 * Handles incoming IoT sensor readings from HTTP or MQTT.
 */
async function processIncomingReading(readingData) {
  const { deviceId, ph, temperature, tds, turbidity, ec, waterLevel, rawValues, isSimulated } = readingData;

  const timestamp = new Date().toISOString();

  // 1. Update device state in DB
  await dbQuery.run(`
    UPDATE devices 
    SET status = 'ONLINE', lastSeen = ?, updatedAt = ?
    WHERE deviceId = ?
  `, [timestamp, timestamp, deviceId]);

  // Notify device reconnected if it was offline
  const io = getIO();
  await handleDeviceConnectionState(deviceId, true, io);

  // 2. Insert reading into DB
  const rawJson = typeof rawValues === 'object' && rawValues !== null ? JSON.stringify(rawValues) : (rawValues || null);
  const insertResult = await dbQuery.run(`
    INSERT INTO readings (deviceId, timestamp, ph, temperature, tds, turbidity, ec, waterLevel, rawValues, isSimulated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    deviceId,
    timestamp,
    ph !== undefined ? ph : null,
    temperature !== undefined ? temperature : null,
    tds !== undefined ? tds : null,
    turbidity !== undefined ? turbidity : null,
    ec !== undefined ? ec : null,
    waterLevel !== undefined ? waterLevel : null,
    rawJson,
    isSimulated ? 1 : 0
  ]);

  const readingRecord = {
    id: insertResult.id,
    deviceId,
    timestamp,
    ph,
    temperature,
    tds,
    turbidity,
    ec,
    waterLevel,
    rawValues: rawValues || null,
    isSimulated: !!isSimulated
  };

  // 3. Compute WQI
  const wqi = calculateWQI(readingRecord);

  // 4. Process Alerts
  await processReadingAlerts(deviceId, readingRecord, io);

  // 5. Broadcast to real-time clients
  broadcastTelemetry(readingRecord, wqi);

  return { reading: readingRecord, wqi };
}

module.exports = { processIncomingReading };
