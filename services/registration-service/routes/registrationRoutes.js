const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireEventOrganizer } = require('../middleware/organizerMiddleware');

// Registration routes
router.get('/', registrationController.getAllRegistrations);
router.get('/:id', registrationController.getRegistrationById);
router.get('/:reg_id/qr', registrationController.getQRCode); // FR-17
router.post('/', registrationController.createRegistration);
router.put('/:id', registrationController.updateRegistration);
router.delete('/:id/cancel', registrationController.cancelRegistration); // FR-16
router.delete('/:id', registrationController.deleteRegistration);
router.get('/participant/:participantId', registrationController.getParticipantRegistrations);

module.exports = router;

