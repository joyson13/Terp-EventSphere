const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and attaches user to request
 * This middleware can be used by other services as well
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Authorization header must be in format: Bearer <token>' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database to ensure they still exist and are not deleted
    const user = await userRepository.findById(decoded.userID);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found or has been deleted' });
    }

    // Attach user to request object
    req.user = {
      userID: decoded.userID,
      role: decoded.role,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error: ' + error.message });
  }
};

module.exports = {
  authenticate,
};

