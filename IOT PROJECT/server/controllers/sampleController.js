const { SampleModel } = require('../models');
const { ResponseHelper, Logger } = require('../utils');

class SampleController {
  static async getAll(req, res) {
    try {
      const samples = await SampleModel.findAll();
      return ResponseHelper.success(res, samples);
    } catch (err) {
      Logger.error('SampleController', err.message);
      return ResponseHelper.error(res, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const sample = await SampleModel.findById(req.params.id);
      if (!sample) {
        return ResponseHelper.error(res, 'Sample not found', 404, 'NOT_FOUND');
      }
      return ResponseHelper.success(res, sample);
    } catch (err) {
      Logger.error('SampleController', err.message);
      return ResponseHelper.error(res, err.message);
    }
  }

  static async create(req, res) {
    try {
      const { sampleName, location } = req.body;
      if (!sampleName || !location) {
        return ResponseHelper.error(res, 'sampleName and location are required fields', 400, 'VALIDATION_ERROR');
      }

      const newSample = await SampleModel.create(req.body);
      return ResponseHelper.success(res, newSample, 'Sample registered successfully', 201);
    } catch (err) {
      Logger.error('SampleController', err.message);
      return ResponseHelper.error(res, err.message);
    }
  }

  static async delete(req, res) {
    try {
      await SampleModel.delete(req.params.id);
      return ResponseHelper.success(res, { deleted: true }, 'Sample removed successfully');
    } catch (err) {
      Logger.error('SampleController', err.message);
      return ResponseHelper.error(res, err.message);
    }
  }

  static async compareLocations(req, res) {
    try {
      const comparison = await SampleModel.getLocationComparison();
      return ResponseHelper.success(res, comparison);
    } catch (err) {
      Logger.error('SampleController', err.message);
      return ResponseHelper.error(res, err.message);
    }
  }
}

module.exports = SampleController;
