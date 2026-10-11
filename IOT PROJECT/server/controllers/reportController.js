const PDFDocument = require('pdfkit');
const { dbQuery } = require('../config/db');
const { calculateWQI } = require('../services/wqiCalculator');

async function exportCsvReport(req, res) {
  try {
    const { deviceId = 'WQ-ESP32-001', range = '24h' } = req.query;

    let timeModifier = "-24 hours";
    if (range === '1h') timeModifier = "-1 hour";
    else if (range === '7d') timeModifier = "-7 days";
    else if (range === '30d') timeModifier = "-30 days";

    const readings = await dbQuery.all(`
      SELECT * FROM readings 
      WHERE deviceId = ? AND timestamp >= datetime('now', ?)
      ORDER BY timestamp DESC
    `, [deviceId, timeModifier]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Water_Quality_${deviceId}_${Date.now()}.csv`);

    let csvContent = 'ID,Device ID,Timestamp,pH,Temperature (°C),TDS (ppm),Turbidity (NTU),EC (uS/cm),Water Level (%),Simulated\n';

    for (const r of readings) {
      csvContent += `${r.id},"${r.deviceId}","${r.timestamp}",${r.ph ?? ''},${r.temperature ?? ''},${r.tds ?? ''},${r.turbidity ?? ''},${r.ec ?? ''},${r.waterLevel ?? ''},${r.isSimulated ? 'YES' : 'NO'}\n`;
    }

    return res.send(csvContent);
  } catch (err) {
    console.error('[Report Controller] Error generating CSV:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function exportPdfReport(req, res) {
  try {
    const { deviceId = 'WQ-ESP32-001' } = req.query;

    const device = await dbQuery.get('SELECT * FROM devices WHERE deviceId = ?', [deviceId]);
    const latestReading = await dbQuery.get(
      'SELECT * FROM readings WHERE deviceId = ? ORDER BY timestamp DESC LIMIT 1',
      [deviceId]
    );
    const calibrations = await dbQuery.all('SELECT * FROM calibrations WHERE deviceId = ?', [deviceId]);
    const alerts = await dbQuery.all(
      'SELECT * FROM alerts WHERE deviceId = ? ORDER BY timestamp DESC LIMIT 10',
      [deviceId]
    );

    const wqi = latestReading ? calculateWQI(latestReading) : null;

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    doc.on('error', (err) => {
      console.error('[PDF Generator] Document error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Error generating PDF document' });
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Water_Quality_Report_${deviceId}_${Date.now()}.pdf`);

    doc.pipe(res);

    // Header Banner
    doc.rect(40, 40, 515, 60).fill('#0f172a');
    doc.fillColor('#38bdf8').fontSize(18).text('IoT WATER QUALITY & CONTENT ANALYZER', 55, 52);
    doc.fillColor('#94a3b8').fontSize(10).text('Official Monitored Parameters Diagnostic Report', 55, 75);
    doc.fillColor('#ffffff').fontSize(9).text(`Generated: ${new Date().toLocaleString()}`, 380, 75);

    doc.moveDown(3);

    // Section 1: Device Information
    doc.fillColor('#0f172a').fontSize(14).text('1. Hardware & System Identity', 40, 120);
    doc.rect(40, 138, 515, 1).fill('#cbd5e1');

    doc.fillColor('#334155').fontSize(10);
    doc.text(`Device Name: ${device?.deviceName || 'ESP32 Water Quality Analyzer'}`, 50, 150);
    doc.text(`Device ID: ${deviceId}`, 50, 165);
    doc.text(`Hardware Status: ${device?.status || 'ONLINE'}`, 50, 180);
    doc.text(`Firmware Version: ${device?.firmwareVersion || '1.0.4-PROD'}`, 300, 150);
    doc.text(`Connection Interface: ${device?.connectionType || 'Wi-Fi 802.11'}`, 300, 165);
    doc.text(`Last Communication: ${device?.lastSeen || 'Just now'}`, 300, 180);

    // Section 2: Water Quality Assessment
    doc.fillColor('#0f172a').fontSize(14).text('2. Comprehensive Quality Evaluation', 40, 215);
    doc.rect(40, 233, 515, 1).fill('#cbd5e1');

    doc.rect(40, 245, 515, 65).fill('#f8fafc');
    doc.rect(40, 245, 515, 65).stroke('#e2e8f0');

    const scoreColor = wqi?.status === 'GOOD' ? '#16a34a' : (wqi?.status === 'WARNING' ? '#ea580c' : '#dc2626');
    doc.fillColor(scoreColor).fontSize(24).text(`WQI SCORE: ${wqi?.score ?? '--'} / 100`, 60, 258);
    doc.fillColor('#475569').fontSize(10).text(`Status Classification: ${wqi?.status || 'N/A'}`, 60, 288);
    doc.fillColor('#334155').fontSize(9).text(
      wqi?.message || 'Measured parameters are currently within the configured limits.',
      260,
      262,
      { width: 280 }
    );
    doc.fillColor('#64748b').fontSize(8).text(
      'Disclaimer: This system is a monitoring and analysis tool, not a laboratory certification system.',
      260,
      288,
      { width: 280 }
    );

    // Section 3: Latest Sensor Readings Table
    doc.fillColor('#0f172a').fontSize(14).text('3. Monitored Sensor Parameters', 40, 330);
    doc.rect(40, 348, 515, 1).fill('#cbd5e1');

    // Table Header
    doc.rect(40, 358, 515, 22).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(9);
    doc.text('Sensor Name', 50, 364);
    doc.text('Current Value', 170, 364);
    doc.text('Unit', 270, 364);
    doc.text('Safe Benchmark', 340, 364);
    doc.text('Status', 460, 364);

    const rows = [
      { name: 'pH Level', val: latestReading?.ph, unit: 'pH', safe: '6.5 - 8.5', ok: latestReading?.ph >= 6.5 && latestReading?.ph <= 8.5 },
      { name: 'Water Temperature', val: latestReading?.temperature, unit: '°C', safe: '15.0 - 30.0', ok: latestReading?.temperature >= 15 && latestReading?.temperature <= 30 },
      { name: 'Total Dissolved Solids (TDS)', val: latestReading?.tds, unit: 'ppm', safe: '< 500', ok: latestReading?.tds <= 500 },
      { name: 'Turbidity', val: latestReading?.turbidity, unit: 'NTU', safe: '< 5.0', ok: latestReading?.turbidity <= 5.0 },
      { name: 'Electrical Conductivity', val: latestReading?.ec, unit: 'µS/cm', safe: '< 800', ok: latestReading?.ec <= 800 },
      { name: 'Water Level', val: latestReading?.waterLevel, unit: '%', safe: '> 20.0', ok: latestReading?.waterLevel >= 20 }
    ];

    let y = 385;
    rows.forEach((r, idx) => {
      const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(40, y - 4, 515, 20).fill(bg);
      doc.fillColor('#0f172a').fontSize(9);
      doc.text(r.name, 50, y);
      doc.text(r.val !== null && r.val !== undefined ? `${r.val}` : 'Not Connected', 170, y);
      doc.text(r.unit, 270, y);
      doc.text(r.safe, 340, y);

      const statusText = r.val === null || r.val === undefined ? 'DISCONNECTED' : (r.ok ? 'NORMAL' : 'ANOMALY');
      const statusColor = r.val === null || r.val === undefined ? '#64748b' : (r.ok ? '#16a34a' : '#dc2626');
      doc.fillColor(statusColor).text(statusText, 460, y);
      y += 22;
    });

    // Section 4: Calibration Profiles
    y += 15;
    doc.fillColor('#0f172a').fontSize(14).text('4. Hardware Calibration Records', 40, y);
    doc.rect(40, y + 18, 515, 1).fill('#cbd5e1');
    y += 26;

    if (calibrations.length === 0) {
      doc.fillColor('#64748b').fontSize(9).text('Factory calibration profile active (No custom profiles registered).', 50, y);
      y += 20;
    } else {
      calibrations.forEach(c => {
        doc.fillColor('#334155').fontSize(9).text(
          `• ${c.sensor}: Calibrated on ${c.calibrationDate} | Status: ${c.status}`,
          50,
          y
        );
        y += 16;
      });
    }

    // Section 5: Recent Alerts Log
    y += 10;
    doc.fillColor('#0f172a').fontSize(14).text('5. Threshold Violations & Alert History', 40, y);
    doc.rect(40, y + 18, 515, 1).fill('#cbd5e1');
    y += 26;

    if (alerts.length === 0) {
      doc.fillColor('#16a34a').fontSize(9).text('No threshold violations or system faults recorded in this period.', 50, y);
    } else {
      alerts.slice(0, 5).forEach(a => {
        const color = a.severity === 'CRITICAL' ? '#dc2626' : (a.severity === 'WARNING' ? '#ea580c' : '#475569');
        doc.fillColor(color).fontSize(8).text(
          `[${a.severity}] ${a.timestamp} - ${a.sensor}: ${a.message} (Resolved: ${a.resolved ? 'YES' : 'NO'})`,
          50,
          y
        );
        y += 14;
      });
    }

    // Footer
    doc.fontSize(8).fillColor('#94a3b8').text(
      'IoT pH Water Quality & Content Analyzer — Automated System Diagnostic Telemetry Export',
      40,
      780,
      { align: 'center', width: 515 }
    );

    doc.end();
  } catch (err) {
    console.error('[Report Controller] Error generating PDF:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  exportCsvReport,
  exportPdfReport
};
