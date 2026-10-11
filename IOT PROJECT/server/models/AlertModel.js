const { dbQuery } = require('../config/db');

class AlertModel {
  static async create(alertData) {
    const {
      deviceId,
      sensor,
      value,
      threshold,
      severity,
      message,
      timestamp = new Date().toISOString()
    } = alertData;

    const result = await dbQuery.run(`
      INSERT INTO alerts (deviceId, sensor, value, threshold, severity, message, timestamp, resolved)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [deviceId, sensor, value, threshold, severity, message, timestamp]);

    return { id: result.id, ...alertData, resolved: 0 };
  }

  static async getActive(deviceId) {
    let sql = 'SELECT * FROM alerts WHERE resolved = 0';
    const params = [];
    if (deviceId) {
      sql += ' AND deviceId = ?';
      params.push(deviceId);
    }
    sql += ' ORDER BY id DESC';
    return await dbQuery.all(sql, params);
  }

  static async getAll(deviceId, limit = 100) {
    let sql = 'SELECT * FROM alerts';
    const params = [];
    if (deviceId) {
      sql += ' WHERE deviceId = ?';
      params.push(deviceId);
    }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);
    return await dbQuery.all(sql, params);
  }

  static async resolve(alertId) {
    const now = new Date().toISOString();
    return await dbQuery.run(`
      UPDATE alerts
      SET resolved = 1, resolvedAt = ?
      WHERE id = ?
    `, [now, alertId]);
  }

  static async resolveAllForDevice(deviceId, sensor = null) {
    const now = new Date().toISOString();
    let sql = 'UPDATE alerts SET resolved = 1, resolvedAt = ? WHERE deviceId = ? AND resolved = 0';
    const params = [now, deviceId];
    if (sensor) {
      sql += ' AND sensor = ?';
      params.push(sensor);
    }
    return await dbQuery.run(sql, params);
  }
}

module.exports = AlertModel;
