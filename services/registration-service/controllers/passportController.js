const passportService = require('../services/passportService');

class PassportController {
  // Get Passport (FR-20)
  async getPassport(req, res) {
    try {
      // Get participant ID from authenticated user
      const participantId = req.user.userID;
      const passport = await passportService.getPassport(participantId);
      res.json(passport);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Internal endpoint for check-in notification (FR-19)
  async handleCheckIn(req, res) {
    try {
      const { participantId, eventId } = req.body;
      
      if (!participantId || !eventId) {
        return res.status(400).json({ error: 'participantId and eventId are required' });
      }

      const badge = await passportService.addBadge(participantId, eventId);
      
      res.json({
        success: true,
        message: 'Badge added to passport',
        badge: badge
      });
    } catch (error) {
      console.error('Error in handleCheckIn:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PassportController();

