const express = require('express');
const router = express.Router();
const {
  getDevices,
  getDeviceStatus,
  registerDevice,
  updateDevice,
  deleteDevice
} = require('../controllers/deviceController');

router.get('/', getDevices);
router.post('/', registerDevice);
router.get('/:deviceId/status', getDeviceStatus);
router.put('/:deviceId', updateDevice);
router.delete('/:deviceId', deleteDevice);

module.exports = router;
