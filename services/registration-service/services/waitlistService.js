const waitlistRepository = require('../repositories/waitlistRepository');
const registrationRepository = require('../repositories/registrationRepository');
const notificationService = require('./notificationService');
const notificationClient = require('../../../shared/services/notificationClient');
const { query } = require('../../../shared/db/config');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class WaitlistService {
  async getAllWaitlistEntries() {
    return await waitlistRepository.findAll();
  }

  async getWaitlistEntryById(entryId) {
    return await waitlistRepository.findById(entryId);
  }

  async createWaitlistEntry(entryData) {
    // Business logic validation
    if (!entryData.participantId || !entryData.eventId) {
      throw new Error('Missing required fields: participantId, eventId');
    }

    // Check if event exists
    const eventResult = await query(
      `SELECT event_id, status FROM events 
       WHERE event_id = $1 AND deleted_at IS NULL`,
      [entryData.eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new Error('Event not found');
    }

    if (eventResult.rows[0].status !== 'published') {
      throw new Error('Event is not published');
    }

    // Check if already on waitlist
    const existing = await waitlistRepository.findByParticipantAndEvent(
      entryData.participantId,
      entryData.eventId
    );

    if (existing) {
      throw new Error('Already on waitlist for this event');
    }

    // Check if already registered
    const registrationResult = await query(
      `SELECT registration_id FROM registrations 
       WHERE participant_id = $1 AND event_id = $2 AND deleted_at IS NULL`,
      [entryData.participantId, entryData.eventId]
    );

    if (registrationResult.rows.length > 0) {
      throw new Error('Already registered for this event');
    }

    return await waitlistRepository.create(entryData);
  }

  /**
   * Trigger waitlist check (FR-16)
   * Promotes the first person on waitlist to confirmed registration when a spot opens
   * @param {string} eventId - Event ID
   */
  async triggerWaitlistCheck(eventId) {
    // Step 1: Check if event is still published
    const eventResult = await query(
      `SELECT e.event_id, e.title, e.location, e.capacity, e.status, e.start_time,
              (SELECT COUNT(*) FROM registrations r 
               WHERE r.event_id = e.event_id 
               AND r.status = 'confirmed' 
               AND r.deleted_at IS NULL) as current_registrations
       FROM events e
       WHERE e.event_id = $1 AND e.deleted_at IS NULL`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      console.log(`Event ${eventId} not found, skipping waitlist check`);
      return null;
    }

    const event = eventResult.rows[0];

    // Step 2: Verify event is still published
    if (event.status !== 'published') {
      console.log(`Event ${eventId} is not published (status: ${event.status}), skipping waitlist check`);
      return null;
    }

    // Step 3: Verify event still has capacity
    const confirmedCount = parseInt(event.current_registrations);
    const capacity = parseInt(event.capacity);

    if (confirmedCount >= capacity) {
      console.log(`Event ${eventId} is still at capacity, skipping waitlist check`);
      return null;
    }

    // Step 4: Get the first waitlist entry (ordered by added_at)
    const waitlistEntry = await waitlistRepository.getFirstWaitlistEntry(eventId);

    if (!waitlistEntry) {
      console.log(`No waitlist entries found for event ${eventId}`);
      return null;
    }

    // Step 5: Delete the waitlist entry
    await waitlistRepository.deleteWaitlistEntry(waitlistEntry.entry_id);

    // Step 6: Create new Registration record with status 'confirmed'
    const registrationId = uuidv4();
    
    // Generate QR code data - use just registrationID
    const qrData = registrationId;

    // Generate QR code image (base64)
    let qrCodeData = null;
    try {
      qrCodeData = await QRCode.toDataURL(qrData);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }

    const registrationResult = await query(
      `INSERT INTO registrations (registration_id, participant_id, event_id, status, qr_code_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING registration_id, participant_id, event_id, status, qr_code_data, created_at, updated_at`,
      [registrationId, waitlistEntry.participant_id, eventId, 'confirmed', qrCodeData]
    );

    const registration = registrationResult.rows[0];

    // Step 7: Get user data for notification
    const userResult = await query(
      `SELECT user_id, email, name, role
       FROM users
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [waitlistEntry.participant_id]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      
      // Step 8: Trigger notification service to send "You're in!" email
      notificationService.notifyWaitlistSuccess(eventId, event, user, registration)
        .catch(err => {
          console.error(`Error sending waitlist success email for event ${eventId}:`, err);
        });

      // Create in-app notification
      await notificationClient.createNotification({
        user_id: waitlistEntry.participant_id,
        type: 'waitlist_success',
        title: "You're In!",
        message: `A spot has opened up for "${event.title}". Your registration has been confirmed!`,
        event_id: eventId
      }).catch(err => console.error('Failed to create notification:', err));
    }

    console.log(`Waitlist promotion successful for event ${eventId}, participant ${waitlistEntry.participant_id}`);
    return registration;
  }

  async deleteWaitlistEntry(entryId) {
    return await waitlistRepository.softDelete(entryId);
  }

  async getParticipantWaitlistEntries(participantId) {
    return await waitlistRepository.findByParticipant(participantId);
  }
}

module.exports = new WaitlistService();

