const { dbQuery } = require('../config/db');

class SampleModel {
  static async findAll() {
    return await dbQuery.all('SELECT * FROM samples ORDER BY id DESC');
  }

  static async findById(id) {
    return await dbQuery.get('SELECT * FROM samples WHERE id = ? OR sampleId = ?', [id, id]);
  }

  static async findByLocation(location) {
    return await dbQuery.all('SELECT * FROM samples WHERE location = ? ORDER BY id DESC', [location]);
  }

  static async create(sampleData) {
    const {
      sampleId = `SMP-${Date.now()}`,
      sampleName,
      location,
      collectionDate = new Date().toISOString().split('T')[0],
      collectionTime = new Date().toTimeString().slice(0, 5),
      collectedBy = 'Field Operator',
      notes = '',
      deviceId = 'WQ-ESP32-001',
      ph = null,
      temperature = null,
      tds = null,
      turbidity = null,
      ec = null,
      waterLevel = null,
      wqiScore = null,
      wqiStatus = 'UNAVAILABLE'
    } = sampleData;

    const result = await dbQuery.run(`
      INSERT INTO samples (sampleId, sampleName, location, collectionDate, collectionTime, collectedBy, notes, deviceId, ph, temperature, tds, turbidity, ec, waterLevel, wqiScore, wqiStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [sampleId, sampleName, location, collectionDate, collectionTime, collectedBy, notes, deviceId, ph, temperature, tds, turbidity, ec, waterLevel, wqiScore, wqiStatus]);

    return await this.findById(result.id);
  }

  static async delete(id) {
    return await dbQuery.run('DELETE FROM samples WHERE id = ? OR sampleId = ?', [id, id]);
  }

  static async getLocationComparison() {
    const rows = await dbQuery.all(`
      SELECT 
        location,
        COUNT(*) as sampleCount,
        ROUND(AVG(ph), 2) as avgPh,
        ROUND(AVG(temperature), 1) as avgTemperature,
        ROUND(AVG(tds), 0) as avgTds,
        ROUND(AVG(turbidity), 2) as avgTurbidity,
        ROUND(AVG(ec), 0) as avgEc,
        ROUND(AVG(wqiScore), 1) as avgWqiScore
      FROM samples
      GROUP BY location
      ORDER BY avgWqiScore DESC
    `);
    return rows;
  }
}

module.exports = SampleModel;
