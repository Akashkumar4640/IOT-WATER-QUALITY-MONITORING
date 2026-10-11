const express = require('express');
const router = express.Router();

const iotRoutes = require('./iotRoutes');
const deviceRoutes = require('./deviceRoutes');
const calibrationRoutes = require('./calibrationRoutes');
const alertRoutes = require('./alertRoutes');
const settingsRoutes = require('./settingsRoutes');
const diagnosticsRoutes = require('./diagnosticsRoutes');
const reportRoutes = require('./reportRoutes');
const sampleRoutes = require('./sampleRoutes');
const aiRoutes = require('./aiRoutes');
const dataQualityRoutes = require('./dataQualityRoutes');
const tdsRoutes = require('./tdsRoutes');

router.use('/iot', iotRoutes);
router.use('/tds', tdsRoutes);
router.use('/devices', deviceRoutes);
router.use('/calibration', calibrationRoutes);
router.use('/alerts', alertRoutes);
router.use('/settings', settingsRoutes);
router.use('/diagnostics', diagnosticsRoutes);
router.use('/reports', reportRoutes);
router.use('/samples', sampleRoutes);
router.use('/ai', aiRoutes);
router.use('/data-quality', dataQualityRoutes);

module.exports = router;
