const { DataQualityModel } = require('../models');
const { ResponseHelper, Logger } = require('../utils');

class DataQualityController {
  static async getSummary(req, res) {
    try {
      const deviceId = req.query.deviceId || null;
      const summary = await DataQualityModel.getSummary(deviceId);
      return ResponseHelper.success(res, summary);
    } catch (err) {
      Logger.error('DataQualityController', err.message);
      return ResponseHelper.error(res, err.message);
    }
  }
}

module.exports = DataQualityController;
