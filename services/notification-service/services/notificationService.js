const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
  /**
   * Create a notification
   * @param {Object} notificationData - { user_id, type, title, message, event_id? }
   */
  async createNotification(notificationData) {
    if (!notificationData.user_id || !notificationData.type || !notificationData.title || !notificationData.message) {
      throw new Error('Missing required fields: user_id, type, title, message');
    }

    const validTypes = [
      'registration_confirmed',
      'waitlist_confirmed',
      'waitlist_success',
      'event_cancelled',
      'event_updated',
      'event_published',
      'registration_cancelled'
    ];

    if (!validTypes.includes(notificationData.type)) {
      throw new Error(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }

    return await notificationRepository.create(notificationData);
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - { limit?, offset?, unreadOnly? }
   */
  async getUserNotifications(userId, options = {}) {
    return await notificationRepository.findByUserId(userId, options);
  }

  /**
   * Get unread notification count
   * @param {string} userId - User ID
   */
  async getUnreadCount(userId) {
    return await notificationRepository.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   */
  async markAsRead(notificationId, userId) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    if (notification.user_id !== userId) {
      throw new Error('Unauthorized');
    }
    return await notificationRepository.markAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   */
  async markAllAsRead(userId) {
    return await notificationRepository.markAllAsRead(userId);
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   */
  async deleteNotification(notificationId, userId) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    if (notification.user_id !== userId) {
      throw new Error('Unauthorized');
    }
    return await notificationRepository.delete(notificationId, userId);
  }
}

module.exports = new NotificationService();

