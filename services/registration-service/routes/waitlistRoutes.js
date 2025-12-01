const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');

// Waitlist routes
router.get('/', waitlistController.getAllWaitlistEntries);
router.get('/:id', waitlistController.getWaitlistEntryById);
router.post('/', waitlistController.createWaitlistEntry);
router.post('/trigger-check', waitlistController.triggerWaitlistCheck); // FR-16
router.delete('/:id', waitlistController.deleteWaitlistEntry);
router.get('/participant/:participantId', waitlistController.getParticipantWaitlistEntries);

module.exports = router;

