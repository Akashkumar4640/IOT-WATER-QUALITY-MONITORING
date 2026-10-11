const { dbQuery } = require('../config/db');

class SettingsModel {
  static async get(key) {
    const row = await dbQuery.get('SELECT * FROM settings WHERE key = ?', [key]);
    if (!row) return null;
    try {
      return JSON.parse(row.value);
    } catch (e) {
      return row.value;
    }
  }

  static async set(key, value) {
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const now = new Date().toISOString();

    await dbQuery.run(`
      INSERT INTO settings (key, value, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updatedAt = excluded.updatedAt
    `, [key, valStr, now]);

    return value;
  }

  static async getAll() {
    const rows = await dbQuery.all('SELECT * FROM settings');
    const settingsMap = {};
    for (const r of rows) {
      try {
        settingsMap[r.key] = JSON.parse(r.value);
      } catch (e) {
        settingsMap[r.key] = r.value;
      }
    }
    return settingsMap;
  }
}

module.exports = SettingsModel;
