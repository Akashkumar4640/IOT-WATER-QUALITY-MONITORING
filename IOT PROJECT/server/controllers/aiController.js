const { SensorReadingModel } = require('../models');
const AIService = require('../services/aiService');
const { ResponseHelper, Logger } = require('../utils');

class AIController {
  static async predict(req, res) {
    try {
      const deviceId = req.query.deviceId || req.params.deviceId || 'WQ-ESP32-001';
      
      // Use latest reading from DB or custom passed body
      let reading = req.body && Object.keys(req.body).length > 0 ? req.body : null;
      if (!reading || (!reading.ph && !reading.tds)) {
        reading = await SensorReadingModel.getLatest(deviceId);
      }

      const evaluation = AIService.evaluateWaterQuality(reading);
      return ResponseHelper.success(res, evaluation);
    } catch (err) {
      Logger.error('AIController', err.message);
      return ResponseHelper.error(res, err.message);
    }
  }

  static async analyzeCustom(req, res) {
    try {
      const reading = req.body;
      const evaluation = AIService.evaluateWaterQuality(reading);
      return ResponseHelper.success(res, evaluation);
    } catch (err) {
      Logger.error('AIController', err.message);
      return ResponseHelper.error(res, err.message);
    }
  }
}

module.exports = AIController;
