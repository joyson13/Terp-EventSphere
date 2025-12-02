const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireEventOrganizer } = require('../middleware/organizerMiddleware');

// Check-in route (FR-18) - Organizer only
router.post('/', authenticate, requireEventOrganizer, registrationController.checkIn);

module.exports = router;

