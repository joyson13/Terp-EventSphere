const axios = require('axios');

/**
 * Waitlist Service Client
 * Makes HTTP requests to waitlist service endpoints
 * Includes retry mechanism for reliability
 */
class WaitlistClient {
  constructor() {
    this.baseURL = process.env.REGISTRATION_SERVICE_URL || 'http://localhost:3003';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Trigger waitlist check for an event (async, non-blocking)
   * @param {string} eventId - Event ID
   * @returns {Promise} - Promise that resolves when request is sent (not waiting for response)
   */
  async triggerWaitlistCheck(eventId) {
    // Fire and forget - don't wait for response
    this._triggerWithRetry(eventId)
      .catch(err => {
        console.error(`Failed to trigger waitlist check for event ${eventId} after retries:`, err);
      });
  }

  /**
   * Internal method to trigger waitlist check with retry mechanism
   * @param {string} eventId - Event ID
   * @param {number} attempt - Current attempt number
   */
  async _triggerWithRetry(eventId, attempt = 1) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/waitlist/trigger-check`,
        { eventId },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Waitlist check triggered for event ${eventId}`, response.data);
      return response.data;
    } catch (error) {
      if (attempt < this.maxRetries) {
        console.warn(`Waitlist check attempt ${attempt} failed for event ${eventId}, retrying...`, error.message);
        await this._delay(this.retryDelay * attempt); // Exponential backoff
        return this._triggerWithRetry(eventId, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Delay helper for retry mechanism
   * @param {number} ms - Milliseconds to delay
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WaitlistClient();

