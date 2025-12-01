const axios = require('axios');

/**
 * Notification Service Client
 * Sends HTTP requests to notification service for async notifications
 * Same pattern as event-service
 */
class NotificationService {
  constructor() {
    this.baseURL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
  }

  /**
   * Send waitlist success email ("You're in!")
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Event data
   * @param {Object} userData - User data
   * @param {Object} registrationData - Registration data
   */
  async notifyWaitlistSuccess(eventId, eventData, userData, registrationData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/notifications/waitlist-success`,
        {
          eventId,
          eventTitle: eventData.title,
          eventLocation: eventData.location,
          eventStartTime: eventData.start_time,
          participantId: userData.user_id,
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

      console.log(`Waitlist success email sent for event ${eventId}`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to send waitlist success email for event ${eventId}:`, error.message);
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.warn(`Notification service unavailable. Waitlist promotion successful but email not sent.`);
      }
      
      return null;
    }
  }
}

module.exports = new NotificationService();

