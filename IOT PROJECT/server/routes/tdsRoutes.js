const express = require('express');
const router = express.Router();
const {
  postDirectTdsReading,
  getDirectTdsReading,
  postTDSTelemetry,
  getLatestTDS,
  getTDSHistory,
  simulateSalt
} = require('../controllers/tdsController');

// Dedicated prototype endpoints for ESP8266 Live TDS Monitor:
// 1. POST /api/tds - accepts JSON { "tds_ppm": 32, "raw_adc": 23.4, "status": "Very Low TDS" }
router.post('/', postDirectTdsReading);

// 2. GET /api/tds - returns latest received real sensor reading or waiting state
router.get('/', getDirectTdsReading);

// 1. Ingest real-time TDS telemetry from ESP8266 NodeMCU
// Accepts POST /api/tds/telemetry or POST /api/tds/reading
router.post('/telemetry', postTDSTelemetry);
router.post('/reading', postTDSTelemetry);
router.get('/reading', postTDSTelemetry); // convenient for testing or lightweight GET-based microcontrollers

// 2. Query latest TDS status & drinkability decision
router.get('/latest', getLatestTDS);

// 3. Query historical TDS trends & distribution statistics
router.get('/history', getTDSHistory);

// 4. Interactive salt addition simulation demo
router.post('/simulate-salt', simulateSalt);

module.exports = router;
