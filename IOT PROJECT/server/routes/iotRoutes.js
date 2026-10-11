const express = require('express');
const router = express.Router();
const { authenticateDevice } = require('../middleware/auth');
const { validateReadingPayload } = require('../middleware/validator');
const { postReadings, getLatestReading, getHistory } = require('../controllers/iotController');

// Ingest sensor readings from ESP32
router.post('/readings', authenticateDevice, validateReadingPayload, postReadings);

// Get latest reading for a device
router.get('/latest/:deviceId', getLatestReading);

// Get historical readings
router.get('/history/:deviceId', getHistory);

module.exports = router;
