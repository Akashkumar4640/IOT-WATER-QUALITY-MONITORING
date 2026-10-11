const { dbQuery } = require('../config/db');
const { getIO } = require('../websocket/socketManager');

async function getAlerts(req, res) {
  try {
    const { deviceId, resolved, severity, limit = 100 } = req.query;

    let sql = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];

    if (deviceId) {
      sql += ' AND deviceId = ?';
      params.push(deviceId);
    }
    if (resolved !== undefined) {
      sql += ' AND resolved = ?';
      params.push(resolved === 'true' || resolved === '1' ? 1 : 0);
    }
    if (severity) {
      sql += ' AND severity = ?';
      params.push(severity);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));

    const alerts = await dbQuery.all(sql, params);
    return res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function resolveAlert(req, res) {
  try {
    const { id } = req.params;
    const alert = await dbQuery.get('SELECT * FROM alerts WHERE id = ?', [id]);

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    await dbQuery.run(
      "UPDATE alerts SET resolved = 1, resolvedAt = datetime('now') WHERE id = ?",
      [id]
    );

    const updated = await dbQuery.get('SELECT * FROM alerts WHERE id = ?', [id]);

    const io = getIO();
    if (io) {
      io.emit('alert_resolved', {
        id: updated.id,
        deviceId: updated.deviceId,
        sensor: updated.sensor,
        resolvedAt: updated.resolvedAt
      });
    }

    return res.json({ success: true, message: 'Alert marked as resolved', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function clearResolvedAlerts(req, res) {
  try {
    const { deviceId } = req.query;
    let sql = 'DELETE FROM alerts WHERE resolved = 1';
    const params = [];
    if (deviceId) {
      sql += ' AND deviceId = ?';
      params.push(deviceId);
    }

    const result = await dbQuery.run(sql, params);
    return res.json({ success: true, message: `Cleared ${result.changes} resolved alerts.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAlerts,
  resolveAlert,
  clearResolvedAlerts
};
