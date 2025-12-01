/**
 * Authentication middleware for registration-service
 * Imports from user-service middleware
 */
const { authenticate } = require('../../user-service/middleware/authMiddleware');

module.exports = {
  authenticate,
};

