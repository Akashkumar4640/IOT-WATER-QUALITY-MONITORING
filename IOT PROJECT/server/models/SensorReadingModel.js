const { dbQuery } = require('../config/db');

class SensorReadingModel {
  /**
   * Insert a new sensor telemetry reading into the database
   */
  static async create(readingData) {
    const {
      deviceId,
      timestamp = new Date().toISOString(),
      ph = null,
      temperature = null,
      tds = null,
      turbidity = null,
      ec = null,
      waterLevel = null,
      rawValues = null,
      isSimulated = 0
    } = readingData;

    const rawStr = typeof rawValues === 'object' && rawValues !== null ? JSON.stringify(rawValues) : rawValues;

    const result = await dbQuery.run(`
      INSERT INTO readings (deviceId, timestamp, ph, temperature, tds, turbidity, ec, waterLevel, rawValues, isSimulated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [deviceId, timestamp, ph, temperature, tds, turbidity, ec, waterLevel, rawStr, isSimulated ? 1 : 0]);

    return { id: result.id, ...readingData };
  }

  /**
   * Get the single latest reading for a specific device
   */
  static async getLatest(deviceId) {
    const row = await dbQuery.get(`
      SELECT * FROM readings
      WHERE deviceId = ?
      ORDER BY id DESC
      LIMIT 1
    `, [deviceId]);

    if (!row) return null;
    return this._formatRow(row);
  }

  /**
   * Query historical readings for a device with optional limit and range
   */
  static async getHistory(deviceId, limit = 50, range = '24h') {
    let rangeCondition = '';
    const now = new Date();

    if (range === '1h') {
      const past = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      rangeCondition = `AND timestamp >= '${past}'`;
    } else if (range === '6h') {
      const past = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
      rangeCondition = `AND timestamp >= '${past}'`;
    } else if (range === '24h') {
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      rangeCondition = `AND timestamp >= '${past}'`;
    } else if (range === '7d') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      rangeCondition = `AND timestamp >= '${past}'`;
    } else if (range === '30d') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      rangeCondition = `AND timestamp >= '${past}'`;
    }

    const rows = await dbQuery.all(`
      SELECT * FROM readings
      WHERE deviceId = ? ${rangeCondition}
      ORDER BY id DESC
      LIMIT ?
    `, [deviceId, Math.min(Math.max(parseInt(limit) || 50, 1), 2000)]);

    return rows.reverse().map(r => this._formatRow(r));
  }

  /**
   * Helper to parse raw JSON values from database row
   */
  static _formatRow(row) {
    let parsedRaw = null;
    if (row.rawValues) {
      try {
        parsedRaw = typeof row.rawValues === 'string' ? JSON.parse(row.rawValues) : row.rawValues;
      } catch (e) {
        parsedRaw = null;
      }
    }
    return {
      ...row,
      rawValues: parsedRaw,
      isSimulated: Boolean(row.isSimulated)
    };
  }
}

module.exports = SensorReadingModel;
