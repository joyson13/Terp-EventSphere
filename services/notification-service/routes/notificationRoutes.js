const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../../../services/user-service/middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

router.get('/', notificationController.getNotifications.bind(notificationController));
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));
router.put('/:id/read', notificationController.markAsRead.bind(notificationController));
router.put('/read-all', notificationController.markAllAsRead.bind(notificationController));
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

module.exports = router;

