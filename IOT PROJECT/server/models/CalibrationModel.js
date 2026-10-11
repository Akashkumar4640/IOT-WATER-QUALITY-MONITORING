const { dbQuery } = require('../config/db');

class CalibrationModel {
  static async findByDeviceAndSensor(deviceId, sensor) {
    const row = await dbQuery.get(`
      SELECT * FROM calibrations
      WHERE deviceId = ? AND sensor = ?
    `, [deviceId, sensor]);

    if (!row) return null;
    return this._formatRow(row);
  }

  static async findByDevice(deviceId) {
    const rows = await dbQuery.all(`
      SELECT * FROM calibrations
      WHERE deviceId = ?
    `, [deviceId]);

    return rows.map(r => this._formatRow(r));
  }

  static async upsert(calibrationData) {
    const {
      deviceId,
      sensor,
      calibrationParameters,
      referenceValues,
      calibrationDate = new Date().toISOString(),
      status = 'ACTIVE'
    } = calibrationData;

    const paramsJson = typeof calibrationParameters === 'object' ? JSON.stringify(calibrationParameters) : calibrationParameters;
    const refJson = typeof referenceValues === 'object' ? JSON.stringify(referenceValues) : referenceValues;

    await dbQuery.run(`
      INSERT INTO calibrations (deviceId, sensor, calibrationParameters, referenceValues, calibrationDate, status)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(deviceId, sensor) DO UPDATE SET
        calibrationParameters = excluded.calibrationParameters,
        referenceValues = excluded.referenceValues,
        calibrationDate = excluded.calibrationDate,
        status = excluded.status
    `, [deviceId, sensor, paramsJson, refJson, calibrationDate, status]);

    return await this.findByDeviceAndSensor(deviceId, sensor);
  }

  static async delete(deviceId, sensor) {
    return await dbQuery.run(`
      DELETE FROM calibrations
      WHERE deviceId = ? AND sensor = ?
    `, [deviceId, sensor]);
  }

  static _formatRow(row) {
    let parsedParams = {};
    let parsedRef = {};
    try {
      parsedParams = typeof row.calibrationParameters === 'string' ? JSON.parse(row.calibrationParameters) : row.calibrationParameters;
    } catch (e) {}
    try {
      parsedRef = typeof row.referenceValues === 'string' ? JSON.parse(row.referenceValues) : row.referenceValues;
    } catch (e) {}

    return {
      ...row,
      calibrationParameters: parsedParams,
      referenceValues: parsedRef
    };
  }
}

module.exports = CalibrationModel;
