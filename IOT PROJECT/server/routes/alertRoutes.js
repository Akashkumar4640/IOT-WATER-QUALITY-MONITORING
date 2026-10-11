const express = require('express');
const router = express.Router();
const {
  getAlerts,
  resolveAlert,
  clearResolvedAlerts
} = require('../controllers/alertController');

router.get('/', getAlerts);
router.put('/:id/resolve', resolveAlert);
router.delete('/', clearResolvedAlerts);

module.exports = router;
