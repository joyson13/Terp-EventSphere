const { query } = require('../../../shared/db/config');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

/**
 * Registration Repository for Event Service
 * Handles database operations for registrations and waitlist entries
 */
class RegistrationRepository {
  /**
   * Find registration by participant and event
<<<<<<< HEAD
=======
   * Excludes cancelled registrations to allow re-registration after cancellation
>>>>>>> 0a145dac583f605661b91a0e90e2c4e5c290222d
   * @param {string} participantId - Participant ID
   * @param {string} eventId - Event ID
   */
  async findByParticipantAndEvent(participantId, eventId) {
    const result = await query(
      `SELECT registration_id, participant_id, event_id, status, qr_code_data, created_at, updated_at
       FROM registrations
<<<<<<< HEAD
=======
       WHERE participant_id = $1 AND event_id = $2 
       AND deleted_at IS NULL 
       AND status NOT IN ('cancelled_by_user', 'cancelled_by_event')`,
      [participantId, eventId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find any registration by participant and event (including cancelled)
   * Used to check for existing registrations that can be reactivated
   * @param {string} participantId - Participant ID
   * @param {string} eventId - Event ID
   */
  async findAnyByParticipantAndEvent(participantId, eventId) {
    const result = await query(
      `SELECT registration_id, participant_id, event_id, status, qr_code_data, created_at, updated_at
       FROM registrations
>>>>>>> 0a145dac583f605661b91a0e90e2c4e5c290222d
       WHERE participant_id = $1 AND event_id = $2 AND deleted_at IS NULL`,
      [participantId, eventId]
    );
    return result.rows[0] || null;
  }

  /**
<<<<<<< HEAD
=======
   * Reactivate a cancelled registration by updating its status and regenerating QR code
   * @param {string} registrationId - Registration ID
   * @param {string} status - New status (usually 'confirmed')
   * @returns {Object} - Updated registration
   */
  async reactivateRegistration(registrationId, status) {
    // First get the existing registration to generate QR code with correct IDs
    const existing = await query(
      `SELECT registration_id, participant_id, event_id FROM registrations WHERE registration_id = $1 AND deleted_at IS NULL`,
      [registrationId]
    );

    if (existing.rows.length === 0) {
      throw new Error('Registration not found');
    }

    const { registration_id, participant_id, event_id } = existing.rows[0];
    
    // Generate QR code data using the existing registration_id
    const qrData = JSON.stringify({
      registrationId: registration_id,
      participantId: participant_id,
      eventId: event_id,
      timestamp: new Date().toISOString()
    });

    // Generate QR code image (base64)
    let qrCodeData = null;
    try {
      qrCodeData = await QRCode.toDataURL(qrData);
    } catch (err) {
      console.error('Error generating QR code:', err);
      // Continue without QR code if generation fails
    }

    const result = await query(
      `UPDATE registrations 
       SET status = $1, qr_code_data = $2, updated_at = CURRENT_TIMESTAMP
       WHERE registration_id = $3 AND deleted_at IS NULL
       RETURNING registration_id, participant_id, event_id, status, qr_code_data, created_at, updated_at`,
      [status, qrCodeData, registrationId]
    );

    return result.rows[0] || null;
  }

  /**
>>>>>>> 0a145dac583f605661b91a0e90e2c4e5c290222d
   * Get count of confirmed registrations for an event
   * @param {string} eventId - Event ID
   */
  async getConfirmedRegistrationCount(eventId) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM registrations
       WHERE event_id = $1 AND status = 'confirmed' AND deleted_at IS NULL`,
      [eventId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Create a new registration
   * @param {string} participantId - Participant ID
   * @param {string} eventId - Event ID
   * @param {string} status - Registration status
   */
  async createRegistration(participantId, eventId, status) {
    const registrationId = uuidv4();
    
    // Generate QR code data
    const qrData = JSON.stringify({
      registrationId: registrationId,
      participantId: participantId,
      eventId: eventId,
      timestamp: new Date().toISOString()
    });

    // Generate QR code image (base64)
    let qrCodeData = null;
    try {
      qrCodeData = await QRCode.toDataURL(qrData);
    } catch (err) {
      console.error('Error generating QR code:', err);
      // Continue without QR code if generation fails
    }
    
    const result = await query(
      `INSERT INTO registrations (registration_id, participant_id, event_id, status, qr_code_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING registration_id, participant_id, event_id, status, qr_code_data, created_at, updated_at`,
      [registrationId, participantId, eventId, status, qrCodeData]
    );

    return result.rows[0];
  }

  /**
   * Find waitlist entry by participant and event
   * @param {string} participantId - Participant ID
   * @param {string} eventId - Event ID
   */
  async findWaitlistEntryByParticipantAndEvent(participantId, eventId) {
    const result = await query(
      `SELECT entry_id, participant_id, event_id, added_at
       FROM waitlist_entries
       WHERE participant_id = $1 AND event_id = $2 AND deleted_at IS NULL`,
      [participantId, eventId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new waitlist entry
   * @param {string} participantId - Participant ID
   * @param {string} eventId - Event ID
   */
  async createWaitlistEntry(participantId, eventId) {
    const entryId = uuidv4();
    
    const result = await query(
      `INSERT INTO waitlist_entries (entry_id, participant_id, event_id)
       VALUES ($1, $2, $3)
       RETURNING entry_id, participant_id, event_id, added_at`,
      [entryId, participantId, eventId]
    );

    // Get position in waitlist
    const positionResult = await query(
      `SELECT COUNT(*) as position
       FROM waitlist_entries
       WHERE event_id = $1 AND added_at <= $2 AND deleted_at IS NULL`,
      [eventId, result.rows[0].added_at]
    );

    return {
      ...result.rows[0],
      position: parseInt(positionResult.rows[0].position)
    };
  }

  /**
   * Get user data by user ID
   * @param {string} userId - User ID
   */
  async getUserById(userId) {
    const result = await query(
      `SELECT user_id, email, name, role
       FROM users
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new RegistrationRepository();

