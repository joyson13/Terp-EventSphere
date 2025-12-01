const waitlistService = require('../services/waitlistService');

class WaitlistController {
  async getAllWaitlistEntries(req, res) {
    try {
      const entries = await waitlistService.getAllWaitlistEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getWaitlistEntryById(req, res) {
    try {
      const { id } = req.params;
      const entry = await waitlistService.getWaitlistEntryById(id);
      if (!entry) {
        return res.status(404).json({ error: 'Waitlist entry not found' });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createWaitlistEntry(req, res) {
    try {
      const entryData = req.body;
      const entry = await waitlistService.createWaitlistEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteWaitlistEntry(req, res) {
    try {
      const { id } = req.params;
      await waitlistService.deleteWaitlistEntry(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getParticipantWaitlistEntries(req, res) {
    try {
      const { participantId } = req.params;
      const entries = await waitlistService.getParticipantWaitlistEntries(participantId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Trigger Waitlist Check (FR-16)
  async triggerWaitlistCheck(req, res) {
    try {
      const { eventId } = req.body;
      if (!eventId) {
        return res.status(400).json({ error: 'eventId is required' });
      }

      const result = await waitlistService.triggerWaitlistCheck(eventId);
      
      if (result) {
        res.json({
          success: true,
          message: 'Waitlist entry promoted to registration',
          registration: result
        });
      } else {
        res.json({
          success: false,
          message: 'No waitlist entry to promote or event conditions not met'
        });
      }
    } catch (error) {
      console.error('Error in triggerWaitlistCheck:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new WaitlistController();

