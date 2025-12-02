/**
 * Admin authorization middleware for event-service
 * Must be used after authenticate middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Access denied. Administrator role required.' });
  }
  next();
};

module.exports = { requireAdmin };
