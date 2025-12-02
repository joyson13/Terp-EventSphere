const axios = require('axios');

/**
 * Passport Service Client
 * Makes HTTP requests to passport service endpoints
 * Used for async communication after check-in
 */
class PassportClient {
  constructor() {
    this.baseURL = process.env.REGISTRATION_SERVICE_URL || 'http://localhost:3003';
  }

  /**
   * Notify passport service about check-in (async, non-blocking)
   * @param {string} participantId - Participant ID
   * @param {string} eventId - Event ID
   */
  async notifyCheckIn(participantId, eventId) {
    // Fire and forget - don't wait for response
    axios.post(
      `${this.baseURL}/api/passport/internal/check-in`,
      { participantId, eventId },
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    .then(response => {
      console.log(`Passport service notified for check-in: participant ${participantId}, event ${eventId}`, response.data);
    })
    .catch(error => {
      console.error(`Failed to notify passport service for check-in: participant ${participantId}, event ${eventId}:`, error.message);
      // Don't fail the check-in if passport service is unavailable
    });
  }
}

module.exports = new PassportClient();

