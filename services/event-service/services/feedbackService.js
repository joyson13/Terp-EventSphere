const feedbackRepository = require('../repositories/feedbackRepository');
const registrationRepository = require('../repositories/registrationRepository');

class FeedbackService {
  /**
   * Create feedback
   * @param {Object} feedbackData - { event_id, participant_id, rating, comment }
   */
  async createFeedback(feedbackData) {
    if (!feedbackData.event_id || !feedbackData.participant_id || !feedbackData.rating) {
      throw new Error('Missing required fields: event_id, participant_id, rating');
    }

    if (feedbackData.rating < 1 || feedbackData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if participant is registered for this event
    const registration = await registrationRepository.findByParticipantAndEvent(
      feedbackData.participant_id,
      feedbackData.event_id
    );

    if (!registration) {
      throw new Error('You must be registered for this event to leave feedback');
    }

    // Check if feedback already exists
    const existingFeedback = await feedbackRepository.findByParticipantAndEvent(
      feedbackData.participant_id,
      feedbackData.event_id
    );

    if (existingFeedback) {
      throw new Error('You have already submitted feedback for this event');
    }

    return await feedbackRepository.create(feedbackData);
  }

  /**
   * Get feedback for an event (organizer only)
   * @param {string} eventId - Event ID
   * @param {string} organizerId - Organizer ID (for verification)
   */
  async getEventFeedback(eventId, organizerId) {
    // Verify organizer owns the event
    const { query } = require('../../../shared/db/config');
    const eventResult = await query(
      `SELECT organizer_id FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new Error('Event not found');
    }

    if (eventResult.rows[0].organizer_id !== organizerId) {
      throw new Error('You do not have permission to view feedback for this event');
    }

    return await feedbackRepository.findByEventId(eventId);
  }

  /**
   * Get feedback by participant and event
   * @param {string} participantId - Participant ID
   * @param {string} eventId - Event ID
   */
  async getParticipantFeedback(participantId, eventId) {
    return await feedbackRepository.findByParticipantAndEvent(participantId, eventId);
  }

  /**
   * Update feedback
   * @param {string} feedbackId - Feedback ID
   * @param {string} participantId - Participant ID (for verification)
   * @param {Object} feedbackData - { rating?, comment? }
   */
  async updateFeedback(feedbackId, participantId, feedbackData) {
    const feedback = await feedbackRepository.findById(feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    if (feedback.participant_id !== participantId) {
      throw new Error('You can only update your own feedback');
    }

    if (feedbackData.rating !== undefined && (feedbackData.rating < 1 || feedbackData.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    return await feedbackRepository.update(feedbackId, feedbackData);
  }
}

module.exports = new FeedbackService();

