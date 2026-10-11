const { dbQuery } = require('../config/db');

class DataQualityModel {
  static async logPacket(deviceId, status, reason = null, packetData = null) {
    const dataStr = typeof packetData === 'object' && packetData !== null ? JSON.stringify(packetData) : packetData;
    return await dbQuery.run(`
      INSERT INTO data_quality_logs (deviceId, timestamp, status, reason, packetData)
      VALUES (?, datetime('now'), ?, ?, ?)
    `, [deviceId, status, reason, dataStr]);
  }

  static async getSummary(deviceId = null) {
    let whereSql = '';
    const params = [];
    if (deviceId) {
      whereSql = 'WHERE deviceId = ?';
      params.push(deviceId);
    }

    const totalReadings = await dbQuery.get(`SELECT COUNT(*) as count FROM readings ${whereSql}`, params);
    const validReadings = await dbQuery.get(`SELECT COUNT(*) as count FROM readings ${whereSql ? whereSql + ' AND' : 'WHERE'} (validationStatus = 'VALID' OR validationStatus IS NULL)`, params);
    const invalidLogs = await dbQuery.get(`SELECT COUNT(*) as count FROM data_quality_logs ${whereSql ? whereSql + ' AND' : 'WHERE'} status = 'INVALID'`, params);
    const duplicateLogs = await dbQuery.get(`SELECT COUNT(*) as count FROM data_quality_logs ${whereSql ? whereSql + ' AND' : 'WHERE'} status = 'DUPLICATE'`, params);
    const staleLogs = await dbQuery.get(`SELECT COUNT(*) as count FROM data_quality_logs ${whereSql ? whereSql + ' AND' : 'WHERE'} status = 'STALE'`, params);

    const recentLogs = await dbQuery.all(`
      SELECT * FROM data_quality_logs
      ${whereSql}
      ORDER BY id DESC
      LIMIT 50
    `, params);

    return {
      totalPackets: (totalReadings?.count || 0) + (invalidLogs?.count || 0),
      validPackets: validReadings?.count || 0,
      invalidPackets: invalidLogs?.count || 0,
      duplicatePackets: duplicateLogs?.count || 0,
      stalePackets: staleLogs?.count || 0,
      validationRate: totalReadings?.count > 0 ? +( ((validReadings?.count || 0) / (totalReadings.count + (invalidLogs?.count || 0))) * 100 ).toFixed(1) : 100.0,
      recentLogs: recentLogs.map(l => ({
        ...l,
        packetData: l.packetData ? JSON.parse(l.packetData) : null
      }))
    };
  }
}

module.exports = DataQualityModel;
