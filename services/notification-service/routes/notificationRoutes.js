const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

// Registration related
router.post('/registration-confirmed', notificationsController.handleRegistrationConfirmed);

// Waitlist related
router.post('/waitlist-confirmed', notificationsController.handleWaitlistConfirmed);
router.post('/waitlist-success', notificationsController.handleWaitlistSuccess);

// Event related
router.post('/event-cancelled', notificationsController.handleEventCancelled);

module.exports = router;