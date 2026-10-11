const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');

router.get('/predict', AIController.predict);
router.post('/predict', AIController.predict);
router.post('/analyze-custom', AIController.analyzeCustom);

module.exports = router;
