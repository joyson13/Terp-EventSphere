const eventService = require('../services/eventService');

class EventController {
  async getAllEvents(req, res) {
    try {
      const events = await eventService.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEventById(req, res) {
    try {
      const { id } = req.params;
      const event = await eventService.getEventById(id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create Event (FR-6)
  async createEvent(req, res) {
    try {
      const eventData = req.body;
      // Get organizer ID from authenticated user
      const organizerId = req.user.userID;
      const event = await eventService.createEvent(eventData, organizerId);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update Event (FR-6, AC-1)
  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const eventData = req.body;
      // Get user ID from authenticated user for ownership verification
      const userId = req.user.userID;
      const event = await eventService.updateEvent(id, eventData, userId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      // Check if it's an ownership error
      if (error.message.includes('permission')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  // Publish Event (FR-9)
  async publishEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userID;
      const event = await eventService.publishEvent(id, userId);
      res.json({
        message: 'Event published successfully',
        event
      });
    } catch (error) {
      if (error.message.includes('permission')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  // Cancel Event (FR-9)
  async cancelEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userID;
      const event = await eventService.cancelEvent(id, userId);
      res.json({
        message: 'Event cancelled successfully. Notifications sent to registered participants.',
        event
      });
    } catch (error) {
      if (error.message.includes('permission')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      await eventService.deleteEvent(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEventRegistrations(req, res) {
    try {
      const { id } = req.params;
      const registrations = await eventService.getEventRegistrations(id);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEventWaitlist(req, res) {
    try {
      const { id } = req.params;
      const waitlist = await eventService.getEventWaitlist(id);
      res.json(waitlist);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Register for Event (FR-13)
  async registerForEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userID;
      const result = await eventService.registerForEvent(id, userId);
      res.status(201).json(result);
    } catch (error) {
      // Check for specific error types
      if (error.message === 'Event is Full') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Already') || error.message.includes('not published')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new EventController();

