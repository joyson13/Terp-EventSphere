/**
 * Shared Authentication Middleware
 * This middleware can be used by any service that needs to verify JWT tokens
 * 
 * Usage in other services:
 * const { authenticate } = require('@terp-eventsphere/shared/middleware/authMiddleware');
 * router.get('/protected-route', authenticate, controller.method);
 * 
 * Note: This is a wrapper that imports from user-service
 * In a production setup, you might want to move this to a shared auth service
 */

// For now, we'll re-export from user-service
// In production, you might want to create a dedicated auth service
const path = require('path');
const userServiceAuth = require('../../services/user-service/middleware/authMiddleware');

module.exports = {
  authenticate: userServiceAuth.authenticate,
};

