const express = require('express');
const router = express.Router();
const {
  exportPdfReport,
  exportCsvReport
} = require('../controllers/reportController');

router.get('/export/pdf', exportPdfReport);
router.get('/export/csv', exportCsvReport);

module.exports = router;
