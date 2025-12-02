/**
 * Admin authorization middleware
 * Must be used after authenticate middleware
 * Checks if the authenticated user has administrator role
 */
const requireAdmin = (req, res, next) => {
  // Ensure authenticate middleware was called first
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user is an administrator
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Access denied. Administrator role required.' });
  }

  next();
};

module.exports = {
  requireAdmin,
};

