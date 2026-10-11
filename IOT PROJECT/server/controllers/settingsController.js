const { dbQuery } = require('../config/db');

async function getThresholdSettings(req, res) {
  try {
    const row = await dbQuery.get('SELECT * FROM settings WHERE key = ?', ['thresholds']);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Threshold settings not found' });
    }
    return res.json({ success: true, data: JSON.parse(row.value) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function updateThresholdSettings(req, res) {
  try {
    const newSettings = req.body;
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid settings payload' });
    }

    await dbQuery.run(`
      INSERT INTO settings (key, value, updatedAt)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updatedAt = datetime('now')
    `, ['thresholds', JSON.stringify(newSettings)]);

    const updated = await dbQuery.get('SELECT * FROM settings WHERE key = ?', ['thresholds']);
    return res.json({
      success: true,
      message: 'Threshold settings updated successfully',
      data: JSON.parse(updated.value)
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getThresholdSettings,
  updateThresholdSettings
};
