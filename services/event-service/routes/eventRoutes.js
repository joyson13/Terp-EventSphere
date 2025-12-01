const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireEventOrganizer } = require('../middleware/organizerMiddleware');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.get('/:id/registrations', eventController.getEventRegistrations);
router.get('/:id/waitlist', eventController.getEventWaitlist);

// Protected routes (require authentication only - any authenticated user can register)
router.post('/:id/register', authenticate, eventController.registerForEvent); // FR-13

// Protected routes (require authentication + event organizer role)
router.post('/', authenticate, requireEventOrganizer, eventController.createEvent); // FR-6
router.put('/:id', authenticate, requireEventOrganizer, eventController.updateEvent); // FR-6, AC-1
router.put('/:id/publish', authenticate, requireEventOrganizer, eventController.publishEvent); // FR-9
router.delete('/:id', authenticate, requireEventOrganizer, eventController.cancelEvent); // FR-9

// Feedback routes (must be before /:id routes to avoid conflicts)
router.put('/feedback/:id', authenticate, feedbackController.updateFeedback.bind(feedbackController));
router.post('/:eventId/feedback', authenticate, feedbackController.createFeedback.bind(feedbackController));
router.get('/:eventId/feedback/organizer', authenticate, requireEventOrganizer, feedbackController.getEventFeedback.bind(feedbackController));
router.get('/:eventId/feedback', authenticate, feedbackController.getParticipantFeedback.bind(feedbackController));

module.exports = router;

