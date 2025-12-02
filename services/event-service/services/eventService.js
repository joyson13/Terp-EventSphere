const eventRepository = require('../repositories/eventRepository');
const registrationRepository = require('../repositories/registrationRepository');
const notificationService = require('./notificationService');
const notificationClient = require('../../../shared/services/notificationClient');

class EventService {
  async getAllEvents() {
    return await eventRepository.findAll();
  }

  async getEventById(eventId) {
    return await eventRepository.findById(eventId);
  }

  /**
   * Create a new event (FR-6)
   * @param {Object} eventData - Event data
   * @param {string} organizerId - Organizer ID from authenticated user
   */
  async createEvent(eventData, organizerId) {
    // Business logic validation
    if (!eventData.title || !eventData.location || !eventData.capacity || !eventData.startTime) {
      throw new Error('Missing required fields: title, location, capacity, startTime');
    }

    if (eventData.capacity <= 0) {
      throw new Error('Capacity must be greater than 0');
    }

    // Set organizer ID from authenticated user and initial status to 'draft'
    const eventDataWithOwner = {
      ...eventData,
      organizerId: organizerId,
      status: 'draft' // Initial status is always 'draft' (FR-6)
    };

    return await eventRepository.create(eventDataWithOwner);
  }

  /**
   * Update an event (FR-6, AC-1)
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Event data to update
   * @param {string} userId - User ID from authenticated user (for ownership verification)
   */
  async updateEvent(eventId, eventData, userId) {
    // First, get the event to verify ownership
    const event = await eventRepository.findById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    // Verify ownership (AC-1)
    if (event.organizer_id !== userId) {
      throw new Error('You do not have permission to update this event. Only the event organizer can update their own events.');
    }

    // Don't allow status changes through update endpoint
    // Status changes should go through specific endpoints (publish, cancel)
    if (eventData.status) {
      delete eventData.status;
    }

    const updatedEvent = await eventRepository.update(eventId, eventData);

    // Get all registrations for this event
    const registrations = await eventRepository.getRegistrations(eventId);
    const participantIds = registrations
      .filter(r => r.status === 'confirmed' || r.status === 'waitlisted')
      .map(r => r.participant_id);

    // Create in-app notifications for all registered participants
    if (participantIds.length > 0) {
      await notificationClient.createNotificationsForUsers(participantIds, {
        type: 'event_updated',
        title: 'Event Updated',
        message: `The event "${event.title}" has been updated. Please check the event details.`,
        event_id: eventId
      }).catch(err => console.error('Failed to create notifications:', err));
    }

    return updatedEvent;
  }

  /**
   * Publish an event (FR-9)
   * Changes status from 'draft' to 'published'
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID from authenticated user (for ownership verification)
   */
  async publishEvent(eventId, userId) {
    const event = await eventRepository.findById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    // Verify ownership
    if (event.organizer_id !== userId) {
      throw new Error('You do not have permission to publish this event. Only the event organizer can publish their own events.');
    }

    // Check current status
    if (event.status !== 'draft') {
      throw new Error(`Cannot publish event. Current status is '${event.status}'. Only events with status 'draft' can be published.`);
    }

    // Update status to 'published'
    const updatedEvent = await eventRepository.update(eventId, { status: 'published' });

    // Create notification for organizer
    await notificationClient.createNotification({
      user_id: userId,
      type: 'event_published',
      title: 'Event Published',
      message: `Your event "${event.title}" has been published and is now visible to participants.`,
      event_id: eventId
    }).catch(err => console.error('Failed to create notification:', err));

    return updatedEvent;
  }

  /**
   * Cancel an event (FR-9)
   * Changes status to 'cancelled' and sends notifications
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID from authenticated user (for ownership verification)
   */
  async cancelEvent(eventId, userId) {
    const event = await eventRepository.findById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    // Verify ownership
    if (event.organizer_id !== userId) {
      throw new Error('You do not have permission to cancel this event. Only the event organizer can cancel their own events.');
    }

    // Check if already cancelled
    if (event.status === 'cancelled') {
      throw new Error('Event is already cancelled');
    }

    // Update status to 'cancelled'
    const updatedEvent = await eventRepository.update(eventId, { status: 'cancelled' });

    // Get all registrations for this event
    const registrations = await eventRepository.getRegistrations(eventId);

    // Send async email notification to notification service (FR-9)
    if (registrations.length > 0) {
      // Fire and forget - don't wait for response
      notificationService.notifyEventCancellation(eventId, updatedEvent, registrations)
        .catch(err => {
          console.error(`Error sending cancellation notifications for event ${eventId}:`, err);
        });
    }

    // Create in-app notifications for all registered participants
    const participantIds = registrations
      .filter(r => r.status === 'confirmed' || r.status === 'waitlisted')
      .map(r => r.participant_id);
    
    if (participantIds.length > 0) {
      await notificationClient.createNotificationsForUsers(participantIds, {
        type: 'event_cancelled',
        title: 'Event Cancelled',
        message: `The event "${event.title}" has been cancelled.`,
        event_id: eventId
      }).catch(err => console.error('Failed to create notifications:', err));
    }

    // Create notification for organizer
    await notificationClient.createNotification({
      user_id: userId,
      type: 'event_cancelled',
      title: 'Event Cancelled',
      message: `Your event "${event.title}" has been cancelled. All registered participants have been notified.`,
      event_id: eventId
    }).catch(err => console.error('Failed to create notification:', err));

    return updatedEvent;
  }

  /**
   * Archive events that have passed their start time
   * Automatically changes status from 'published' to 'completed'
   */
  async archivePastEvents() {
    const result = await eventRepository.archivePastEvents();
    return result;
  }

  async deleteEvent(eventId) {
    return await eventRepository.softDelete(eventId);
  }

  async getEventRegistrations(eventId) {
    return await eventRepository.getRegistrations(eventId);
  }

  async getEventWaitlist(eventId) {
    return await eventRepository.getWaitlist(eventId);
  }

  async isFull(eventId) {
    const event = await this.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    
    const registrations = await this.getEventRegistrations(eventId);
    const confirmedCount = registrations.filter(r => r.status === 'confirmed').length;
    
    return confirmedCount >= event.capacity;
  }

  /**
   * Register user for an event (FR-13)
   * Implements the full registration algorithm from Diagram 6
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID from authenticated user
   * @returns {Object} - Registration result
   */
  async registerForEvent(eventId, userId) {
    // Step 1: Get the userID from auth middleware (already passed as userId)
    
    // Step 2: Fetch Event and User data
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if event is published
    if (event.status !== 'published') {
      throw new Error('Event is not published. Only published events can be registered for.');
    }

    const user = await registrationRepository.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Step 3: Check if user is already registered
    const existingRegistration = await registrationRepository.findByParticipantAndEvent(userId, eventId);
    if (existingRegistration) {
      throw new Error('Already registered for this event');
    }

    // Step 4: Check if user is already on waitlist
    const existingWaitlist = await registrationRepository.findWaitlistEntryByParticipantAndEvent(userId, eventId);
    if (existingWaitlist) {
      throw new Error('Already on waitlist for this event');
    }

    // Step 5: Check event's capacity against current confirmed registrations
    const confirmedCount = await registrationRepository.getConfirmedRegistrationCount(eventId);
    const hasCapacity = confirmedCount < event.capacity;

    // Step 6: If capacity available - Create Registration with status 'Confirmed'
    if (hasCapacity) {
      const registration = await registrationRepository.createRegistration(
        userId,
        eventId,
        'confirmed'
      );

      // Step 7: Trigger confirmation email (FR-14)
      notificationService.notifyRegistrationConfirmation(eventId, event, user, registration)
        .catch(err => {
          console.error(`Error sending registration confirmation email for event ${eventId}:`, err);
        });

      // Create in-app notification
      await notificationClient.createNotification({
        user_id: userId,
        type: 'registration_confirmed',
        title: 'Registration Confirmed',
        message: `Your registration for "${event.title}" has been confirmed.`,
        event_id: eventId
      }).catch(err => console.error('Failed to create notification:', err));

      return {
        success: true,
        message: 'Registration Confirmed',
        registration: registration,
        status: 'confirmed'
      };
    }

    // Step 8: If no capacity - Check if waitlist is enabled
    if (event.waitlist_enabled) {
      // Step 9: Create WaitlistEntry record
      const waitlistEntry = await registrationRepository.createWaitlistEntry(userId, eventId);

      // Step 10: Trigger waitlist confirmation email
      notificationService.notifyWaitlistConfirmation(eventId, event, user, waitlistEntry)
        .catch(err => {
          console.error(`Error sending waitlist confirmation email for event ${eventId}:`, err);
        });

      // Create in-app notification
      await notificationClient.createNotification({
        user_id: userId,
        type: 'waitlist_confirmed',
        title: 'Added to Waitlist',
        message: `You have been added to the waitlist for "${event.title}".`,
        event_id: eventId
      }).catch(err => console.error('Failed to create notification:', err));

      return {
        success: true,
        message: 'You are on the waitlist',
        waitlistEntry: waitlistEntry,
        status: 'waitlisted',
        position: waitlistEntry.position
      };
    }

    // Step 11: If no waitlist - Return "Event is Full" error
    throw new Error('Event is Full');
  }
}

module.exports = new EventService();

