const notificationService = require('../services/notificationService');

class NotificationController {
  /**
   * Get all notifications for authenticated user
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.userID;
      const { limit, offset, unreadOnly } = req.query;
      
      const options = {};
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);
      if (unreadOnly === 'true') options.unreadOnly = true;

      const notifications = await notificationService.getUserNotifications(userId, options);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.userID;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userID;
      const notification = await notificationService.markAsRead(id, userId);
      res.json(notification);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userID;
      await notificationService.markAllAsRead(userId);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userID;
      await notificationService.deleteNotification(id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new NotificationController();

