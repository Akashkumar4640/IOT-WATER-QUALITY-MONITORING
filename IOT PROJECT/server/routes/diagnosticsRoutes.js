const express = require('express');
const router = express.Router();
const {
  getSystemDiagnostics,
  injectTestPacket
} = require('../controllers/diagnosticsController');

router.get('/system', getSystemDiagnostics);
router.post('/test-packet', injectTestPacket);

module.exports = router;
