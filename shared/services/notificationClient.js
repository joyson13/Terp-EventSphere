const axios = require('axios');
const { query } = require('../db/config');

/**
 * Notification Client
 * Creates notifications in the database and sends via WebSocket
 */
class NotificationClient {
  constructor() {
    this.notificationServiceURL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
  }

  /**
   * Create a notification for a user
   * @param {Object} notificationData - { user_id, type, title, message, event_id? }
   */
  async createNotification(notificationData) {
    try {
      // Insert notification directly into database
      const { v4: uuidv4 } = require('uuid');
      const notificationId = uuidv4();
      
      const result = await query(
        `INSERT INTO notifications (notification_id, user_id, type, title, message, event_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING notification_id, user_id, type, title, message, event_id, read, created_at`,
        [
          notificationId,
          notificationData.user_id,
          notificationData.type,
          notificationData.title,
          notificationData.message,
          notificationData.event_id || null
        ]
      );

      const notification = result.rows[0];

      // Send via WebSocket if notification service is available
      try {
        await axios.post(
          `${this.notificationServiceURL}/api/notifications/broadcast`,
          { notification },
          {
            timeout: 2000,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } catch (wsError) {
        // WebSocket broadcast failed, but notification is saved
        console.warn('Failed to broadcast notification via WebSocket:', wsError.message);
      }

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error.message);
      // Don't throw - notifications are non-critical
      return null;
    }
  }

  /**
   * Create notifications for multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notificationData - { type, title, message, event_id? }
   */
  async createNotificationsForUsers(userIds, notificationData) {
    const notifications = [];
    for (const userId of userIds) {
      const notification = await this.createNotification({
        ...notificationData,
        user_id: userId
      });
      if (notification) {
        notifications.push(notification);
      }
    }
    return notifications;
  }
}

module.exports = new NotificationClient();

