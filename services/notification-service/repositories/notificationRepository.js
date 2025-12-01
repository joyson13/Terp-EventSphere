const { query } = require('../../../shared/db/config');
const { v4: uuidv4 } = require('uuid');

class NotificationRepository {
  /**
   * Create a new notification
   * @param {Object} notificationData - { user_id, type, title, message, event_id? }
   */
  async create(notificationData) {
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
    return result.rows[0];
  }

  /**
   * Get all notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - { limit?, offset?, unreadOnly? }
   */
  async findByUserId(userId, options = {}) {
    let sql = `
      SELECT notification_id, user_id, type, title, message, event_id, read, created_at
      FROM notifications
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
    const params = [userId];
    let paramCount = 2;

    if (options.unreadOnly) {
      sql += ` AND read = false`;
    }

    sql += ` ORDER BY created_at DESC`;

    if (options.limit) {
      sql += ` LIMIT $${paramCount++}`;
      params.push(options.limit);
    }

    if (options.offset) {
      sql += ` OFFSET $${paramCount++}`;
      params.push(options.offset);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   */
  async getUnreadCount(userId) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = $1 AND read = false AND deleted_at IS NULL`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for security)
   */
  async markAsRead(notificationId, userId) {
    const result = await query(
      `UPDATE notifications
       SET read = true
       WHERE notification_id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING notification_id, read`,
      [notificationId, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   */
  async markAllAsRead(userId) {
    await query(
      `UPDATE notifications
       SET read = true
       WHERE user_id = $1 AND read = false AND deleted_at IS NULL`,
      [userId]
    );
  }

  /**
   * Get notification by ID
   * @param {string} notificationId - Notification ID
   */
  async findById(notificationId) {
    const result = await query(
      `SELECT notification_id, user_id, type, title, message, event_id, read, created_at
       FROM notifications
       WHERE notification_id = $1 AND deleted_at IS NULL`,
      [notificationId]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete notification (soft delete)
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for security)
   */
  async delete(notificationId, userId) {
    const result = await query(
      `UPDATE notifications
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE notification_id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING notification_id`,
      [notificationId, userId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new NotificationRepository();

