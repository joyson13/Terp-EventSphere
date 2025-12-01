const { query } = require('../../../shared/db/config');
const { v4: uuidv4 } = require('uuid');

class WaitlistRepository {
  async findAll() {
    const result = await query(
      `SELECT w.entry_id, w.participant_id, w.event_id, w.added_at,
              u.name as participant_name, u.email as participant_email,
              e.title as event_title, e.location as event_location, e.start_time as event_start_time
       FROM waitlist_entries w
       JOIN participants p ON w.participant_id = p.user_id
       JOIN users u ON p.user_id = u.user_id
       JOIN events e ON w.event_id = e.event_id
       WHERE w.deleted_at IS NULL
       ORDER BY w.added_at ASC`
    );
    return result.rows;
  }

  async findById(entryId) {
    const result = await query(
      `SELECT w.entry_id, w.participant_id, w.event_id, w.added_at,
              u.name as participant_name, u.email as participant_email,
              e.title as event_title, e.location as event_location, e.start_time as event_start_time
       FROM waitlist_entries w
       JOIN participants p ON w.participant_id = p.user_id
       JOIN users u ON p.user_id = u.user_id
       JOIN events e ON w.event_id = e.event_id
       WHERE w.entry_id = $1 AND w.deleted_at IS NULL`,
      [entryId]
    );
    return result.rows[0] || null;
  }

  async findByParticipantAndEvent(participantId, eventId) {
    const result = await query(
      `SELECT entry_id, participant_id, event_id, added_at
       FROM waitlist_entries
       WHERE participant_id = $1 AND event_id = $2 AND deleted_at IS NULL`,
      [participantId, eventId]
    );
    return result.rows[0] || null;
  }

  async findByParticipant(participantId) {
    const result = await query(
      `SELECT w.entry_id, w.participant_id, w.event_id, w.added_at,
              e.title as event_title, e.location as event_location, e.start_time as event_start_time
       FROM waitlist_entries w
       JOIN events e ON w.event_id = e.event_id
       WHERE w.participant_id = $1 AND w.deleted_at IS NULL
       ORDER BY w.added_at ASC`,
      [participantId]
    );
    return result.rows;
  }

  async create(entryData) {
    const entryId = uuidv4();
    
    const result = await query(
      `INSERT INTO waitlist_entries (entry_id, participant_id, event_id)
       VALUES ($1, $2, $3)
       RETURNING entry_id, participant_id, event_id, added_at`,
      [entryId, entryData.participantId, entryData.eventId]
    );

    return result.rows[0];
  }

  async softDelete(entryId) {
    const result = await query(
      `UPDATE waitlist_entries 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE entry_id = $1 AND deleted_at IS NULL
       RETURNING entry_id`,
      [entryId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get the first waitlist entry for an event (ordered by added_at)
   * @param {string} eventId - Event ID
   * @returns {Object} - First waitlist entry or null
   */
  async getFirstWaitlistEntry(eventId) {
    const result = await query(
      `SELECT entry_id, participant_id, event_id, added_at
       FROM waitlist_entries
       WHERE event_id = $1 AND deleted_at IS NULL
       ORDER BY added_at ASC
       LIMIT 1`,
      [eventId]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete waitlist entry by ID
   * @param {string} entryId - Waitlist entry ID
   */
  async deleteWaitlistEntry(entryId) {
    const result = await query(
      `UPDATE waitlist_entries 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE entry_id = $1 AND deleted_at IS NULL
       RETURNING entry_id, participant_id, event_id`,
      [entryId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new WaitlistRepository();

