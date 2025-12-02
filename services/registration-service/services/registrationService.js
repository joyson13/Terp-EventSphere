const registrationRepository = require('../repositories/registrationRepository');
const waitlistClient = require('./waitlistClient');
const passportClient = require('./passportClient');
const notificationClient = require('../../../shared/services/notificationClient');
const { query } = require('../../../shared/db/config');

class RegistrationService {
  async getAllRegistrations() {
    return await registrationRepository.findAll();
  }

  async getRegistrationById(registrationId) {
    return await registrationRepository.findById(registrationId);
  }

  async createRegistration(registrationData) {
    // Business logic validation
    if (!registrationData.participantId || !registrationData.eventId) {
      throw new Error('Missing required fields: participantId, eventId');
    }

    // Check if event exists and is not full
    const eventResult = await query(
      `SELECT e.capacity, e.status,
              (SELECT COUNT(*) FROM registrations r 
               WHERE r.event_id = e.event_id 
               AND r.status = 'confirmed' 
               AND r.deleted_at IS NULL) as current_registrations
       FROM events e
       WHERE e.event_id = $1 AND e.deleted_at IS NULL`,
      [registrationData.eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new Error('Event not found');
    }

    const event = eventResult.rows[0];
    
    if (event.status !== 'published') {
      throw new Error('Event is not published');
    }

    if (parseInt(event.current_registrations) >= parseInt(event.capacity)) {
      throw new Error('Event is full');
    }

    // Check if already registered
    const existing = await registrationRepository.findByParticipantAndEvent(
      registrationData.participantId,
      registrationData.eventId
    );

    if (existing) {
      throw new Error('Already registered for this event');
    }

    const registration = await registrationRepository.create(registrationData);

    // Get event details for notification
    const eventDetails = await query(
      `SELECT event_title FROM events WHERE event_id = $1`,
      [registrationData.eventId]
    );

    // Create notification for participant
    await notificationClient.createNotification({
      user_id: registrationData.participantId,
      type: 'registration_confirmed',
      title: 'Registration Confirmed',
      message: `You have successfully registered for "${eventDetails.rows[0]?.event_title || 'the event'}".`,
      event_id: registrationData.eventId
    }).catch(err => console.error('Failed to create notification:', err));

    return registration;
  }

  async updateRegistration(registrationId, registrationData) {
    return await registrationRepository.update(registrationId, registrationData);
  }

  /**
   * Cancel registration (FR-16)
   * Changes status to 'cancelled_by_user' and triggers waitlist check
   * @param {string} registrationId - Registration ID
   * @returns {Object} - Cancelled registration
   */
  async cancelRegistration(registrationId) {
    // Get registration with event_id before cancelling
    const registration = await registrationRepository.findByIdWithEvent(registrationId);
    
    if (!registration) {
      throw new Error('Registration not found');
    }

    // Cancel the registration (change status to 'cancelled_by_user')
    const cancelledRegistration = await registrationRepository.cancelRegistration(registrationId);
    
    if (!cancelledRegistration) {
      throw new Error('Failed to cancel registration');
    }

    // Create notification for participant
    await notificationClient.createNotification({
      user_id: registration.participant_id,
      type: 'registration_cancelled',
      title: 'Registration Cancelled',
      message: `Your registration for "${registration.event_title}" has been cancelled.`,
      event_id: registration.event_id
    }).catch(err => console.error('Failed to create notification:', err));

    // Trigger async waitlist check (non-blocking)
    // This will check if there's someone on the waitlist and promote them
    waitlistClient.triggerWaitlistCheck(registration.event_id)
      .catch(err => {
        console.error(`Error triggering waitlist check for event ${registration.event_id}:`, err);
      });

    return cancelledRegistration;
  }

  async deleteRegistration(registrationId) {
    return await registrationRepository.softDelete(registrationId);
  }

  async getParticipantRegistrations(participantId) {
    return await registrationRepository.findByParticipant(participantId);
  }

  /**
   * Get QR code for a registration (FR-17)
   * @param {string} registrationId - Registration ID
   */
  async getQRCode(registrationId) {
    const qrCode = await registrationRepository.getQRCode(registrationId);
    if (!qrCode) {
      throw new Error('Registration not found');
    }
    return qrCode;
  }

  /**
   * Check-in participant (FR-18)
   * Changes status from 'confirmed' to 'attended' (idempotent)
   * @param {string} registrationId - Registration ID from QR code
   * @returns {Object} - Updated registration with participant and event info
   */
  async checkIn(registrationId) {
    // Find registration
    const registration = await registrationRepository.findByRegistrationId(registrationId);
    
    if (!registration) {
      throw new Error('Registration not found');
    }

    // Check if already attended (idempotent check)
    if (registration.status === 'attended') {
      // Already checked in, return existing registration
      return registration;
    }

    // Check if status is 'confirmed'
    if (registration.status !== 'confirmed') {
      throw new Error(`Cannot check in. Registration status is '${registration.status}'. Only 'confirmed' registrations can be checked in.`);
    }

    // Update status to 'attended' (idempotent - only updates if status is 'confirmed')
    const updatedRegistration = await registrationRepository.markAsAttended(registrationId);
    
    if (!updatedRegistration) {
      throw new Error('Failed to check in. Registration may have already been checked in or status changed.');
    }

    // Trigger passport service to add badge (FR-19)
    // Fire and forget - async, non-blocking
    passportClient.notifyCheckIn(registration.participant_id, registration.event_id);

    // Create notification for participant
    await notificationClient.createNotification({
      user_id: registration.participant_id,
      type: 'check_in_success',
      title: 'Check-in Successful',
      message: `You have successfully checked in to "${registration.event_title}".`,
      event_id: registration.event_id
    }).catch(err => console.error('Failed to create notification:', err));

    return {
      ...updatedRegistration,
      event_title: registration.event_title,
      event_start_time: registration.event_start_time,
      participant_name: registration.participant_name,
      participant_email: registration.participant_email
    };
  }
}

module.exports = new RegistrationService();

