const { query } = require('../../../shared/db/config');
const { v4: uuidv4 } = require('uuid');

class FeedbackRepository {
  /**
   * Create feedback
   * @param {Object} feedbackData - { event_id, participant_id, rating, comment }
   */
  async create(feedbackData) {
    const feedbackId = uuidv4();
    const result = await query(
      `INSERT INTO event_feedback (feedback_id, event_id, participant_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING feedback_id, event_id, participant_id, rating, comment, created_at, updated_at`,
      [
        feedbackId,
        feedbackData.event_id,
        feedbackData.participant_id,
        feedbackData.rating,
        feedbackData.comment || null
      ]
    );
    return result.rows[0];
  }

  /**
   * Get feedback by event ID (for organizers)
   * @param {string} eventId - Event ID
   */
  async findByEventId(eventId) {
    const result = await query(
      `SELECT 
         f.feedback_id,
         f.event_id,
         f.participant_id,
         f.rating,
         f.comment,
         f.created_at,
         f.updated_at,
         u.name as participant_name,
         u.email as participant_email
       FROM event_feedback f
       JOIN users u ON f.participant_id = u.user_id
       WHERE f.event_id = $1 AND f.deleted_at IS NULL
       ORDER BY f.created_at DESC`,
      [eventId]
    );
    return result.rows;
  }

  /**
   * Get feedback by participant and event
   * @param {string} participantId - Participant ID
   * @param {string} eventId - Event ID
   */
  async findByParticipantAndEvent(participantId, eventId) {
    const result = await query(
      `SELECT feedback_id, event_id, participant_id, rating, comment, created_at, updated_at
       FROM event_feedback
       WHERE participant_id = $1 AND event_id = $2 AND deleted_at IS NULL`,
      [participantId, eventId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update feedback
   * @param {string} feedbackId - Feedback ID
   * @param {Object} feedbackData - { rating?, comment? }
   */
  async update(feedbackId, feedbackData) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (feedbackData.rating !== undefined) {
      updates.push(`rating = $${paramCount++}`);
      values.push(feedbackData.rating);
    }

    if (feedbackData.comment !== undefined) {
      updates.push(`comment = $${paramCount++}`);
      values.push(feedbackData.comment);
    }

    if (updates.length === 0) {
      return await this.findById(feedbackId);
    }

    values.push(feedbackId);
    const result = await query(
      `UPDATE event_feedback
       SET ${updates.join(', ')}
       WHERE feedback_id = $${paramCount} AND deleted_at IS NULL
       RETURNING feedback_id, event_id, participant_id, rating, comment, created_at, updated_at`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Get feedback by ID
   * @param {string} feedbackId - Feedback ID
   */
  async findById(feedbackId) {
    const result = await query(
      `SELECT feedback_id, event_id, participant_id, rating, comment, created_at, updated_at
       FROM event_feedback
       WHERE feedback_id = $1 AND deleted_at IS NULL`,
      [feedbackId]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete feedback (soft delete)
   * @param {string} feedbackId - Feedback ID
   */
  async softDelete(feedbackId) {
    const result = await query(
      `UPDATE event_feedback
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE feedback_id = $1 AND deleted_at IS NULL
       RETURNING feedback_id`,
      [feedbackId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new FeedbackRepository();

