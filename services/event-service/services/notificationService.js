const axios = require('axios');

/**
 * Notification Service Client
 * Sends HTTP requests to notification service for async notifications
 */
class NotificationService {
  constructor() {
    this.baseURL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
  }

  /**
   * Send event cancellation notification to all registered participants
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Event data
   * @param {Array} registrations - List of registrations
   */
  async notifyEventCancellation(eventId, eventData, registrations) {
    try {
      // Send async HTTP request to notification service
      const response = await axios.post(
        `${this.baseURL}/api/notifications/event-cancelled`,
        {
          eventId,
          eventTitle: eventData.title,
          eventLocation: eventData.location,
          eventStartTime: eventData.start_time,
          participants: registrations.map(reg => ({
            participantId: reg.participant_id,
            participantName: reg.participant_name,
            participantEmail: reg.participant_email
          }))
        },
        {
          timeout: 5000, // 5 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Notification sent for event cancellation: ${eventId}`, response.data);
      return response.data;
    } catch (error) {
      // Log error but don't fail the request
      // In production, you might want to queue this for retry
      console.error(`Failed to send notification for event ${eventId}:`, error.message);
      
      // If notification service is not available, log and continue
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.warn(`Notification service unavailable. Event ${eventId} cancelled but notifications not sent.`);
      }
      
      // Return null to indicate notification was not sent
      return null;
    }
  }

  /**
   * Send registration confirmation email (FR-14)
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Event data
   * @param {Object} userData - User data
   * @param {Object} registrationData - Registration data
   */
  async notifyRegistrationConfirmation(eventId, eventData, userData, registrationData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/notifications/registration-confirmed`,
        {
          eventId,
          eventTitle: eventData.title,
          eventLocation: eventData.location,
          eventStartTime: eventData.start_time,
          participantId: userData.userID,
          participantName: userData.name,
          participantEmail: userData.email,
          registrationId: registrationData.registration_id,
          qrCodeData: registrationData.qr_code_data
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Registration confirmation email sent for event ${eventId}`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to send registration confirmation email for event ${eventId}:`, error.message);
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.warn(`Notification service unavailable. Registration confirmed but email not sent.`);
      }
      
      return null;
    }
  }

  /**
   * Send waitlist confirmation email
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Event data
   * @param {Object} userData - User data
   * @param {Object} waitlistData - Waitlist entry data
   */
  async notifyWaitlistConfirmation(eventId, eventData, userData, waitlistData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/notifications/waitlist-confirmed`,
        {
          eventId,
          eventTitle: eventData.title,
          eventLocation: eventData.location,
          eventStartTime: eventData.start_time,
          participantId: userData.userID,
          participantName: userData.name,
          participantEmail: userData.email,
          waitlistEntryId: waitlistData.entry_id,
          position: waitlistData.position
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Waitlist confirmation email sent for event ${eventId}`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to send waitlist confirmation email for event ${eventId}:`, error.message);
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.warn(`Notification service unavailable. Waitlist entry created but email not sent.`);
      }
      
      return null;
    }
  }
}

module.exports = new NotificationService();

