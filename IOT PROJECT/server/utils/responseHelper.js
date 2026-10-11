/**
 * Standardized API response format helper
 */
class ResponseHelper {
  static success(res, data = null, message = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        details
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ResponseHelper;
