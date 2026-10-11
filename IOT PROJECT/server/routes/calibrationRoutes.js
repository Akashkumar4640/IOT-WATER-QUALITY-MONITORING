const express = require('express');
const router = express.Router();
const {
  saveCalibration,
  getCalibration,
  resetCalibration
} = require('../controllers/calibrationController');

router.post('/', saveCalibration);
router.get('/:deviceId', getCalibration);
router.delete('/:deviceId/:sensor', resetCalibration);

module.exports = router;
