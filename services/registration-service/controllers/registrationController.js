const registrationService = require('../services/registrationService');

class RegistrationController {
  async getAllRegistrations(req, res) {
    try {
      const registrations = await registrationService.getAllRegistrations();
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRegistrationById(req, res) {
    try {
      const { id } = req.params;
      const registration = await registrationService.getRegistrationById(id);
      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }
      res.json(registration);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createRegistration(req, res) {
    try {
      const registrationData = req.body;
      const registration = await registrationService.createRegistration(registrationData);
      res.status(201).json(registration);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateRegistration(req, res) {
    try {
      const { id } = req.params;
      const registrationData = req.body;
      const registration = await registrationService.updateRegistration(id, registrationData);
      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }
      res.json(registration);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Cancel Registration (FR-16)
  async cancelRegistration(req, res) {
    try {
      const { id } = req.params;
      const cancelled = await registrationService.cancelRegistration(id);
      res.json({
        message: 'Registration cancelled successfully',
        registration: cancelled
      });
    } catch (error) {
      if (error.message === 'Registration not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async deleteRegistration(req, res) {
    try {
      const { id } = req.params;
      await registrationService.deleteRegistration(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getParticipantRegistrations(req, res) {
    try {
      const { participantId } = req.params;
      const registrations = await registrationService.getParticipantRegistrations(participantId);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get QR Code (FR-17)
  async getQRCode(req, res) {
    try {
      const { reg_id } = req.params;
      const qrCode = await registrationService.getQRCode(reg_id);
      res.json({
        registration_id: qrCode.registration_id,
        qr_code_data: qrCode.qr_code_data
      });
    } catch (error) {
      if (error.message === 'Registration not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Check-in (FR-18)
  async checkIn(req, res) {
    try {
      const { qrCodeData } = req.body;
      
      if (!qrCodeData) {
        return res.status(400).json({ error: 'qrCodeData is required' });
      }

      // qrCodeData should be just the registrationID string
      const registrationId = qrCodeData;
      
      const registration = await registrationService.checkIn(registrationId);
      
      res.json({
        message: 'Check-in successful',
        registration: registration
      });
    } catch (error) {
      if (error.message === 'Registration not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Cannot check in')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new RegistrationController();

