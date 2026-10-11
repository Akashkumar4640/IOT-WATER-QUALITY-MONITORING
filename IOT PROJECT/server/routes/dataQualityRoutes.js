const express = require('express');
const router = express.Router();
const DataQualityController = require('../controllers/dataQualityController');

router.get('/summary', DataQualityController.getSummary);

module.exports = router;
