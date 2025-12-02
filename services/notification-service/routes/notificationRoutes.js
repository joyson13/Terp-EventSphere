const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
<<<<<<< HEAD
const { authenticate } = require('../middleware/authMiddleware');
=======
const { authenticate } = require('../../../services/user-service/middleware/authMiddleware');
>>>>>>> 0a145dac583f605661b91a0e90e2c4e5c290222d

// All routes require authentication
router.use(authenticate);

router.get('/', notificationController.getNotifications.bind(notificationController));
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));
router.put('/:id/read', notificationController.markAsRead.bind(notificationController));
router.put('/read-all', notificationController.markAllAsRead.bind(notificationController));
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

module.exports = router;

