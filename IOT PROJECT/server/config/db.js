const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, 'water_quality.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DB] Failed to connect to SQLite database:', err.message);
  } else {
    console.log('[DB] Connected to SQLite database at:', dbPath);
    // Enable Write-Ahead Logging (WAL) for high-concurrency read/write operations
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA synchronous = NORMAL;');
    db.run('PRAGMA busy_timeout = 5000;');
  }
});

// Helper for promise-based queries with timeout and validation
const dbQuery = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) {
          console.error('[DB Run Error]:', err.message, 'SQL:', sql);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          console.error('[DB Get Error]:', err.message, 'SQL:', sql);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('[DB All Error]:', err.message, 'SQL:', sql);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
};

async function initDatabase() {
  // 1. Devices Table
  await dbQuery.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId TEXT UNIQUE NOT NULL,
      deviceName TEXT NOT NULL,
      deviceToken TEXT NOT NULL,
      status TEXT DEFAULT 'OFFLINE',
      firmwareVersion TEXT DEFAULT '1.0.0',
      connectionType TEXT DEFAULT 'Wi-Fi',
      lastSeen DATETIME,
      ipAddress TEXT,
      rssi INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Sensor Readings Table
  await dbQuery.run(`
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      ph REAL,
      temperature REAL,
      tds REAL,
      turbidity REAL,
      ec REAL,
      waterLevel REAL,
      rawValues TEXT,
      isSimulated INTEGER DEFAULT 0,
      validationStatus TEXT DEFAULT 'VALID',
      validationReason TEXT,
      FOREIGN KEY (deviceId) REFERENCES devices(deviceId)
    )
  `);

  // Indexes for fast historical queries
  await dbQuery.run(`CREATE INDEX IF NOT EXISTS idx_readings_device_time ON readings(deviceId, timestamp)`);

  // Ensure newer columns exist for older DB instances
  try {
    await dbQuery.run(`ALTER TABLE readings ADD COLUMN validationStatus TEXT DEFAULT 'VALID'`);
  } catch (e) {}
  try {
    await dbQuery.run(`ALTER TABLE readings ADD COLUMN validationReason TEXT`);
  } catch (e) {}

  // 3. Alerts Table
  await dbQuery.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId TEXT NOT NULL,
      sensor TEXT NOT NULL,
      value REAL,
      threshold TEXT,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved INTEGER DEFAULT 0,
      resolvedAt DATETIME
    )
  `);

  await dbQuery.run(`CREATE INDEX IF NOT EXISTS idx_alerts_device_resolved ON alerts(deviceId, resolved)`);

  // 4. Calibration Table
  await dbQuery.run(`
    CREATE TABLE IF NOT EXISTS calibrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId TEXT NOT NULL,
      sensor TEXT NOT NULL,
      calibrationParameters TEXT NOT NULL,
      referenceValues TEXT NOT NULL,
      calibrationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'ACTIVE',
      UNIQUE(deviceId, sensor)
    )
  `);

  // 5. System Settings / Thresholds Table
  await dbQuery.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 6. Water Samples Management Table
  await dbQuery.run(`
    CREATE TABLE IF NOT EXISTS samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sampleId TEXT UNIQUE NOT NULL,
      sampleName TEXT NOT NULL,
      location TEXT NOT NULL,
      collectionDate TEXT NOT NULL,
      collectionTime TEXT NOT NULL,
      collectedBy TEXT,
      notes TEXT,
      deviceId TEXT,
      ph REAL,
      temperature REAL,
      tds REAL,
      turbidity REAL,
      ec REAL,
      waterLevel REAL,
      wqiScore REAL,
      wqiStatus TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbQuery.run(`CREATE INDEX IF NOT EXISTS idx_samples_location ON samples(location)`);
  await dbQuery.run(`CREATE INDEX IF NOT EXISTS idx_samples_sampleId ON samples(sampleId)`);

  // 7. Data Quality & Telemetry Ingestion Audit Logs
  await dbQuery.run(`
    CREATE TABLE IF NOT EXISTS data_quality_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL,
      reason TEXT,
      packetData TEXT
    )
  `);

  await dbQuery.run(`CREATE INDEX IF NOT EXISTS idx_data_quality_device ON data_quality_logs(deviceId, timestamp)`);

  // 8. Dedicated TDS Drinking Water Readings Table
  await dbQuery.run(`
    CREATE TABLE IF NOT EXISTS tds_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      tds REAL NOT NULL,
      voltage REAL,
      temperature REAL DEFAULT 25.0,
      rawAdc INTEGER,
      statusCode TEXT NOT NULL,
      statusLabel TEXT NOT NULL,
      likelyComponents TEXT NOT NULL,
      notes TEXT
    )
  `);
  await dbQuery.run(`CREATE INDEX IF NOT EXISTS idx_tds_readings_time ON tds_readings(deviceId, timestamp)`);

  // Seed default device if none exists
  const existingDevice = await dbQuery.get('SELECT * FROM devices WHERE deviceId = ?', ['WQ-ESP32-001']);
  if (!existingDevice) {
    await dbQuery.run(`
      INSERT INTO devices (deviceId, deviceName, deviceToken, status, firmwareVersion, connectionType, lastSeen)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['WQ-ESP32-001', 'ESP32 Water Quality Analyzer', 'wq-sec-token-esp32-001', 'ONLINE', '1.0.4-PROD', 'Wi-Fi (802.11 b/g/n)', new Date().toISOString()]);
    console.log('[DB] Seeded default device: WQ-ESP32-001');
  }

  // Seed ESP8266 NodeMCU TDS Checker Device
  const existingTdsDevice = await dbQuery.get('SELECT * FROM devices WHERE deviceId = ?', ['NODEMCU-TDS-01']);
  if (!existingTdsDevice) {
    await dbQuery.run(`
      INSERT INTO devices (deviceId, deviceName, deviceToken, status, firmwareVersion, connectionType, lastSeen)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['NODEMCU-TDS-01', 'ESP8266 NodeMCU TDS Checker', 'nodemcu-sec-token-tds-01', 'ONLINE', '1.2.0-TDS', 'Wi-Fi (NodeMCU 802.11b/g/n)', new Date().toISOString()]);
    console.log('[DB] Seeded default device: NODEMCU-TDS-01');
  }

  // Seed default threshold settings
  const defaultThresholds = {
    ph: { min: 6.5, max: 8.5, criticalMin: 5.5, criticalMax: 9.5, unit: 'pH' },
    temperature: { min: 10.0, max: 35.0, criticalMin: 5.0, criticalMax: 45.0, unit: '°C' },
    tds: { warning: 300, max: 500, criticalMax: 1000, unit: 'ppm' },
    turbidity: { warning: 5.0, max: 10.0, criticalMax: 25.0, unit: 'NTU' },
    ec: { warning: 500, max: 800, criticalMax: 1500, unit: 'µS/cm' },
    waterLevel: { min: 20, max: 95, unit: '%' },
    offlineTimeoutSeconds: 15
  };

  const existingThresholds = await dbQuery.get('SELECT * FROM settings WHERE key = ?', ['thresholds']);
  if (!existingThresholds) {
    await dbQuery.run(`
      INSERT INTO settings (key, value, updatedAt)
      VALUES (?, ?, ?)
    `, ['thresholds', JSON.stringify(defaultThresholds), new Date().toISOString()]);
    console.log('[DB] Seeded default parameter thresholds');
  }

  // Seed baseline samples if table is empty
  const sampleCount = await dbQuery.get('SELECT COUNT(*) as count FROM samples');
  if (sampleCount && sampleCount.count === 0) {
    const defaultSamples = [
      {
        sampleId: 'SMP-2026-001',
        sampleName: 'Municipal Drinking Water Intake',
        location: 'City Reservoir',
        collectionDate: '2026-09-15',
        collectionTime: '08:30',
        collectedBy: 'Lead Chemist J. Miller',
        notes: 'Pre-filtration municipal intake basin audit sample.',
        deviceId: 'WQ-ESP32-001',
        ph: 7.35,
        temperature: 22.4,
        tds: 185,
        turbidity: 0.85,
        ec: 280,
        waterLevel: 88,
        wqiScore: 92.4,
        wqiStatus: 'EXCELLENT'
      },
      {
        sampleId: 'SMP-2026-002',
        sampleName: 'Agricultural Borewell Sample',
        location: 'Deep Borewell 4',
        collectionDate: '2026-09-16',
        collectionTime: '11:15',
        collectedBy: 'Field Tech D. Vance',
        notes: 'Groundwater source with slight mineral salinity.',
        deviceId: 'WQ-ESP32-001',
        ph: 6.82,
        temperature: 24.1,
        tds: 430,
        turbidity: 2.10,
        ec: 620,
        waterLevel: 65,
        wqiScore: 78.5,
        wqiStatus: 'GOOD'
      },
      {
        sampleId: 'SMP-2026-003',
        sampleName: 'RO Filtration Plant Permeate',
        location: 'RO Outlet Stream',
        collectionDate: '2026-09-16',
        collectionTime: '14:00',
        collectedBy: 'QA Inspector R. Chen',
        notes: 'Post-membrane demineralized purified drinking stream.',
        deviceId: 'WQ-ESP32-001',
        ph: 7.10,
        temperature: 21.8,
        tds: 48,
        turbidity: 0.20,
        ec: 75,
        waterLevel: 95,
        wqiScore: 97.8,
        wqiStatus: 'EXCELLENT'
      },
      {
        sampleId: 'SMP-2026-004',
        sampleName: 'Industrial Discharge Runoff',
        location: 'Effluent Canal',
        collectionDate: '2026-09-17',
        collectionTime: '09:45',
        collectedBy: 'Environmental Officer S. Kumar',
        notes: 'High particulate turbidity and ionic conductivity detected.',
        deviceId: 'WQ-ESP32-001',
        ph: 5.60,
        temperature: 31.5,
        tds: 920,
        turbidity: 18.50,
        ec: 1420,
        waterLevel: 42,
        wqiScore: 28.3,
        wqiStatus: 'CRITICAL'
      }
    ];

    for (const s of defaultSamples) {
      await dbQuery.run(`
        INSERT INTO samples (sampleId, sampleName, location, collectionDate, collectionTime, collectedBy, notes, deviceId, ph, temperature, tds, turbidity, ec, waterLevel, wqiScore, wqiStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [s.sampleId, s.sampleName, s.location, s.collectionDate, s.collectionTime, s.collectedBy, s.notes, s.deviceId, s.ph, s.temperature, s.tds, s.turbidity, s.ec, s.waterLevel, s.wqiScore, s.wqiStatus]);
    }
    console.log('[DB] Seeded baseline water quality samples');
  }

  console.log('[DB] Database schema and seeds initialized successfully');
}

module.exports = { db, dbQuery, initDatabase };
