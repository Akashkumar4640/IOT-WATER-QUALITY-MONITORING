const { dbQuery } = require('../config/db');

class DeviceModel {
  static async findAll() {
    return await dbQuery.all('SELECT * FROM devices ORDER BY id ASC');
  }

  static async findByDeviceId(deviceId) {
    return await dbQuery.get('SELECT * FROM devices WHERE deviceId = ?', [deviceId]);
  }

  static async create(deviceData) {
    const {
      deviceId,
      deviceName,
      deviceToken,
      firmwareVersion = '1.0.0',
      connectionType = 'Wi-Fi'
    } = deviceData;

    const now = new Date().toISOString();
    await dbQuery.run(`
      INSERT INTO devices (deviceId, deviceName, deviceToken, status, firmwareVersion, connectionType, lastSeen, createdAt, updatedAt)
      VALUES (?, ?, ?, 'ONLINE', ?, ?, ?, ?, ?)
    `, [deviceId, deviceName, deviceToken, firmwareVersion, connectionType, now, now, now]);

    return await this.findByDeviceId(deviceId);
  }

  static async updateStatus(deviceId, status, metadata = {}) {
    const now = new Date().toISOString();
    const { rssi = null, ipAddress = null } = metadata;
    
    if (rssi !== null && ipAddress !== null) {
      await dbQuery.run(`
        UPDATE devices
        SET status = ?, lastSeen = ?, rssi = ?, ipAddress = ?, updatedAt = ?
        WHERE deviceId = ?
      `, [status, now, rssi, ipAddress, now, deviceId]);
    } else {
      await dbQuery.run(`
        UPDATE devices
        SET status = ?, lastSeen = ?, updatedAt = ?
        WHERE deviceId = ?
      `, [status, now, now, deviceId]);
    }
  }

  static async updateDevice(deviceId, updateFields) {
    const { deviceName, firmwareVersion, connectionType, status } = updateFields;
    const now = new Date().toISOString();

    await dbQuery.run(`
      UPDATE devices
      SET deviceName = COALESCE(?, deviceName),
          firmwareVersion = COALESCE(?, firmwareVersion),
          connectionType = COALESCE(?, connectionType),
          status = COALESCE(?, status),
          updatedAt = ?
      WHERE deviceId = ?
    `, [deviceName, firmwareVersion, connectionType, status, now, deviceId]);

    return await this.findByDeviceId(deviceId);
  }

  static async delete(deviceId) {
    return await dbQuery.run('DELETE FROM devices WHERE deviceId = ?', [deviceId]);
  }
}

module.exports = DeviceModel;
