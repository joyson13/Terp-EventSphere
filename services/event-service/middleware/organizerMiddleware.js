/**
 * Event Organizer authorization middleware
 * Must be used after authenticate middleware
 * Checks if the authenticated user has event_organizer role
 */
const requireEventOrganizer = (req, res, next) => {
  // Ensure authenticate middleware was called first
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user is an event organizer
  if (req.user.role !== 'event_organizer') {
    return res.status(403).json({ error: 'Access denied. Event organizer role required.' });
  }

  next();
};

module.exports = {
  requireEventOrganizer,
};

