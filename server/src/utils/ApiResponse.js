/**
 * Standardized API Response formatter.
 * Guarantees a predictable structure for frontend consumption.
 */
export class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {*} data - Payload returned by the endpoint
   * @param {string} message - Human-readable success message
   */
  constructor(statusCode, data = null, message = 'Success') {
    this.success = statusCode >= 200 && statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  // Pre-configured static factory methods
  static success(res, statusCode = 200, message = 'Success', data = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
  }

  static ok(res, data = null, message = 'Success') {
    return res.status(200).json(new ApiResponse(200, data, message));
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return res.status(201).json(new ApiResponse(201, data, message));
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

export default ApiResponse;
