const { query } = require('../../../shared/db/config');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

class RegistrationRepository {
  async findAll() {
    const result = await query(
      `SELECT r.registration_id, r.participant_id, r.event_id, r.status, r.qr_code_data,
              r.created_at, r.updated_at,
              u.name as participant_name, u.email as participant_email,
              e.title as event_title, e.location as event_location, e.start_time as event_start_time
       FROM registrations r
       JOIN participants p ON r.participant_id = p.user_id
       JOIN users u ON p.user_id = u.user_id
       JOIN events e ON r.event_id = e.event_id
       WHERE r.deleted_at IS NULL
       ORDER BY r.created_at DESC`
    );
    return result.rows;
  }

  async findById(registrationId) {
    const result = await query(
      `SELECT r.registration_id, r.participant_id, r.event_id, r.status, r.qr_code_data,
              r.created_at, r.updated_at,
              u.name as participant_name, u.email as participant_email,
              e.title as event_title, e.location as event_location, e.start_time as event_start_time
       FROM registrations r
       JOIN participants p ON r.participant_id = p.user_id
       JOIN users u ON p.user_id = u.user_id
       JOIN events e ON r.event_id = e.event_id
       WHERE r.registration_id = $1 AND r.deleted_at IS NULL`,
      [registrationId]
    );
    return result.rows[0] || null;
  }

  async findByParticipantAndEvent(participantId, eventId) {
    const result = await query(
      `SELECT registration_id, participant_id, event_id, status, qr_code_data, created_at, updated_at
       FROM registrations
       WHERE participant_id = $1 AND event_id = $2 AND deleted_at IS NULL`,
      [participantId, eventId]
    );
    return result.rows[0] || null;
  }

  async findByParticipant(participantId) {
    const result = await query(
      `SELECT r.registration_id, r.participant_id, r.event_id, r.status, r.qr_code_data,
              r.created_at, r.updated_at,
              e.title as event_title, e.location as event_location, e.start_time as event_start_time
       FROM registrations r
       JOIN events e ON r.event_id = e.event_id
       WHERE r.participant_id = $1 AND r.deleted_at IS NULL
       ORDER BY e.start_time ASC`,
      [participantId]
    );
    return result.rows;
  }

  async create(registrationData) {
    const registrationId = uuidv4();
    
    // Generate QR code data - use just registrationID
    const qrData = registrationId;

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
      [
        registrationId,
        registrationData.participantId,
        registrationData.eventId,
        registrationData.status || 'confirmed',
        qrCodeData
      ]
    );

    return result.rows[0];
  }

  /**
   * Get QR code for a registration
   * @param {string} registrationId - Registration ID
   */
  async getQRCode(registrationId) {
    const result = await query(
      `SELECT registration_id, qr_code_data
       FROM registrations
       WHERE registration_id = $1 AND deleted_at IS NULL`,
      [registrationId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find registration by registration ID (for check-in)
   * @param {string} registrationId - Registration ID
   */
  async findByRegistrationId(registrationId) {
    const result = await query(
      `SELECT r.registration_id, r.participant_id, r.event_id, r.status, r.created_at, r.updated_at,
              e.title as event_title, e.start_time as event_start_time,
              u.name as participant_name, u.email as participant_email
       FROM registrations r
       JOIN events e ON r.event_id = e.event_id
       JOIN users u ON r.participant_id = u.user_id
       WHERE r.registration_id = $1 AND r.deleted_at IS NULL`,
      [registrationId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update registration status to 'attended' (idempotent)
   * @param {string} registrationId - Registration ID
   */
  async markAsAttended(registrationId) {
    // Only update if status is 'confirmed', otherwise do nothing (idempotent)
    const result = await query(
      `UPDATE registrations 
       SET status = 'attended', updated_at = CURRENT_TIMESTAMP 
       WHERE registration_id = $1 
       AND status = 'confirmed' 
       AND deleted_at IS NULL
       RETURNING registration_id, participant_id, event_id, status`,
      [registrationId]
    );
    return result.rows[0] || null;
  }

  async update(registrationId, registrationData) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (registrationData.status) {
      updates.push(`status = $${paramCount++}`);
      values.push(registrationData.status);
    }

    if (updates.length === 0) {
      return await this.findById(registrationId);
    }

    values.push(registrationId);
    const result = await query(
      `UPDATE registrations 
       SET ${updates.join(', ')} 
       WHERE registration_id = $${paramCount} AND deleted_at IS NULL
       RETURNING registration_id, participant_id, event_id, status, qr_code_data, created_at, updated_at`,
      values
    );

    return result.rows[0] || null;
  }

  async softDelete(registrationId) {
    const result = await query(
      `UPDATE registrations 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE registration_id = $1 AND deleted_at IS NULL
       RETURNING registration_id`,
      [registrationId]
    );
    return result.rows[0] || null;
  }

  /**
   * Cancel registration - change status to 'cancelled_by_user'
   * @param {string} registrationId - Registration ID
   * @returns {Object} - Cancelled registration with event_id
   */
  async cancelRegistration(registrationId) {
    const result = await query(
      `UPDATE registrations 
       SET status = 'cancelled_by_user', updated_at = CURRENT_TIMESTAMP 
       WHERE registration_id = $1 AND deleted_at IS NULL
       RETURNING registration_id, participant_id, event_id, status`,
      [registrationId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get registration by ID with event_id
   * @param {string} registrationId - Registration ID
   */
  async findByIdWithEvent(registrationId) {
    const result = await query(
      `SELECT r.registration_id, r.participant_id, r.event_id, r.status
       FROM registrations r
       WHERE r.registration_id = $1 AND r.deleted_at IS NULL`,
      [registrationId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new RegistrationRepository();

