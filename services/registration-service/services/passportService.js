const { query } = require('../../../shared/db/config');
const { v4: uuidv4 } = require('uuid');

/**
 * Passport Service
 * Handles Terrapin Passport and Badge operations
 */
class PassportService {
  /**
   * Get passport for a participant (FR-20)
   * @param {string} participantId - Participant ID
   * @returns {Object} - Passport with badges
   */
  async getPassport(participantId) {
    // Get or create passport
    let passport = await this.findPassportByParticipant(participantId);
    
    if (!passport) {
      // Create passport if it doesn't exist
      passport = await this.createPassport(participantId);
    }

    // Get all badges for this passport
    const badges = await this.getBadgesByPassport(passport.passport_id);

    return {
      passport_id: passport.passport_id,
      participant_id: passport.participant_id,
      badges: badges,
      created_at: passport.created_at,
      updated_at: passport.updated_at
    };
  }

  /**
   * Find passport by participant ID
   * @param {string} participantId - Participant ID
   */
  async findPassportByParticipant(participantId) {
    const result = await query(
      `SELECT passport_id, participant_id, created_at, updated_at
       FROM terrapin_passports
       WHERE participant_id = $1 AND deleted_at IS NULL`,
      [participantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create passport for a participant
   * @param {string} participantId - Participant ID
   */
  async createPassport(participantId) {
    const passportId = uuidv4();
    
    const result = await query(
      `INSERT INTO terrapin_passports (passport_id, participant_id)
       VALUES ($1, $2)
       RETURNING passport_id, participant_id, created_at, updated_at`,
      [passportId, participantId]
    );

    // Update participant's passport_id reference
    await query(
      `UPDATE participants 
       SET passport_id = $1 
       WHERE user_id = $2`,
      [passportId, participantId]
    );

    return result.rows[0];
  }

  /**
   * Get all badges for a passport
   * @param {string} passportId - Passport ID
   */
  async getBadgesByPassport(passportId) {
    const result = await query(
      `SELECT b.badge_id, b.passport_id, b.event_id, b.event_name, b.date_earned, b.created_at,
              e.title as event_title, e.location as event_location, e.start_time as event_start_time
       FROM badges b
       LEFT JOIN events e ON b.event_id = e.event_id
       WHERE b.passport_id = $1 AND b.deleted_at IS NULL
       ORDER BY b.date_earned DESC`,
      [passportId]
    );
    return result.rows;
  }

  /**
   * Add badge to passport (FR-19)
   * Called internally after check-in
   * @param {string} participantId - Participant ID
   * @param {string} eventId - Event ID
   */
  async addBadge(participantId, eventId) {
    // Get or create passport
    let passport = await this.findPassportByParticipant(participantId);
    
    if (!passport) {
      passport = await this.createPassport(participantId);
    }

    // Check if badge already exists for this event
    const existingBadge = await query(
      `SELECT badge_id FROM badges 
       WHERE passport_id = $1 AND event_id = $2 AND deleted_at IS NULL`,
      [passport.passport_id, eventId]
    );

    if (existingBadge.rows.length > 0) {
      // Badge already exists, return existing badge
      console.log(`Badge already exists for participant ${participantId}, event ${eventId}`);
      return existingBadge.rows[0];
    }

    // Get event name
    const eventResult = await query(
      `SELECT title FROM events 
       WHERE event_id = $1 AND deleted_at IS NULL`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new Error('Event not found');
    }

    const eventName = eventResult.rows[0].title;

    // Create badge
    const badgeId = uuidv4();
    const result = await query(
      `INSERT INTO badges (badge_id, passport_id, event_id, event_name)
       VALUES ($1, $2, $3, $4)
       RETURNING badge_id, passport_id, event_id, event_name, date_earned, created_at`,
      [badgeId, passport.passport_id, eventId, eventName]
    );

    console.log(`Badge created for participant ${participantId}, event ${eventId}`);
    return result.rows[0];
  }
}

module.exports = new PassportService();

