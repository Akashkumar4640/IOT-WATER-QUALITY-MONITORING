const express = require('express');
const router = express.Router();
const {
  getThresholdSettings,
  updateThresholdSettings
} = require('../controllers/settingsController');

router.get('/thresholds', getThresholdSettings);
router.put('/thresholds', updateThresholdSettings);

module.exports = router;
