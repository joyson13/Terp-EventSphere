const express = require('express');
const router = express.Router();
const passportController = require('../controllers/passportController');
const { authenticate } = require('../middleware/authMiddleware');

// Public passport routes (require authentication)
router.get('/', authenticate, passportController.getPassport); // FR-20

// Internal passport routes (no auth required - called by registration service)
router.post('/internal/check-in', passportController.handleCheckIn); // FR-19

module.exports = router;

