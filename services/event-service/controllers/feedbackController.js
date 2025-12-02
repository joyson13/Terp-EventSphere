const feedbackService = require('../services/feedbackService');

class FeedbackController {
  /**
   * Create feedback
   */
  async createFeedback(req, res) {
    try {
      const { eventId } = req.params; // Get event_id from route params
      const { rating, comment } = req.body;
      const participantId = req.user.userID;

      const feedback = await feedbackService.createFeedback({
        event_id: eventId,
        participant_id: participantId,
        rating,
        comment
      });

      res.status(201).json(feedback);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get feedback for an event (organizer only)
   */
  async getEventFeedback(req, res) {
    try {
      const { eventId } = req.params;
      const organizerId = req.user.userID;

      const feedback = await feedbackService.getEventFeedback(eventId, organizerId);
      res.json(feedback);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  }

  /**
   * Get feedback by participant and event
   */
  async getParticipantFeedback(req, res) {
    try {
      const { eventId } = req.params;
      const participantId = req.user.userID;

      const feedback = await feedbackService.getParticipantFeedback(participantId, eventId);
      res.json(feedback || null);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update feedback
   */
  async updateFeedback(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const participantId = req.user.userID;

      const feedback = await feedbackService.updateFeedback(id, participantId, { rating, comment });
      res.json(feedback);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new FeedbackController();

