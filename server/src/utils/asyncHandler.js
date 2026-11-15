/**
 * Higher-order function that catches asynchronous exceptions
 * and routes them to Express error-handling middleware.
 *
 * @param {Function} fn - Asynchronous route handler
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
