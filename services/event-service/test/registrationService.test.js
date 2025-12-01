const { expect } = require('chai');
const sinon = require('sinon');
const eventService = require('../services/eventService');
const eventRepository = require('../repositories/eventRepository');
const registrationRepository = require('../repositories/registrationRepository');
const notificationService = require('../services/notificationService');

describe('EventService - Registration Algorithm (FR-13)', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('registerForEvent - Success Branch (Capacity Available)', () => {
    it('should create registration with confirmed status when capacity is available', async () => {
      // Arrange
      const eventId = 'event-123';
      const userId = 'user-123';
      
      const mockEvent = {
        event_id: eventId,
        title: 'Test Event',
        location: 'Test Location',
        capacity: 100,
        status: 'published',
        waitlist_enabled: true,
        start_time: new Date()
      };

      const mockUser = {
        user_id: userId,
        email: 'user@example.com',
        name: 'Test User',
        role: 'participant'
      };

      const mockRegistration = {
        registration_id: 'reg-123',
        participant_id: userId,
        event_id: eventId,
        status: 'confirmed',
        qr_code_data: 'qr-data',
        created_at: new Date()
      };

      // Stub repository methods
      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);
      sandbox.stub(registrationRepository, 'getUserById').resolves(mockUser);
      sandbox.stub(registrationRepository, 'findByParticipantAndEvent').resolves(null);
      sandbox.stub(registrationRepository, 'findWaitlistEntryByParticipantAndEvent').resolves(null);
      sandbox.stub(registrationRepository, 'getConfirmedRegistrationCount').resolves(50); // Less than capacity
      sandbox.stub(registrationRepository, 'createRegistration').resolves(mockRegistration);
      sandbox.stub(notificationService, 'notifyRegistrationConfirmation').resolves({});

      // Act
      const result = await eventService.registerForEvent(eventId, userId);

      // Assert
      expect(result.success).to.be.true;
      expect(result.message).to.equal('Registration Confirmed');
      expect(result.status).to.equal('confirmed');
      expect(result.registration).to.deep.equal(mockRegistration);
      expect(registrationRepository.createRegistration).to.have.been.calledOnceWith(
        userId,
        eventId,
        'confirmed'
      );
      expect(notificationService.notifyRegistrationConfirmation).to.have.been.calledOnce;
    });
  });

  describe('registerForEvent - Waitlist Branch (No Capacity, Waitlist Enabled)', () => {
    it('should create waitlist entry when event is full but waitlist is enabled', async () => {
      // Arrange
      const eventId = 'event-123';
      const userId = 'user-123';
      
      const mockEvent = {
        event_id: eventId,
        title: 'Test Event',
        location: 'Test Location',
        capacity: 100,
        status: 'published',
        waitlist_enabled: true, // Waitlist enabled
        start_time: new Date()
      };

      const mockUser = {
        user_id: userId,
        email: 'user@example.com',
        name: 'Test User',
        role: 'participant'
      };

      const mockWaitlistEntry = {
        entry_id: 'waitlist-123',
        participant_id: userId,
        event_id: eventId,
        added_at: new Date(),
        position: 5
      };

      // Stub repository methods
      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);
      sandbox.stub(registrationRepository, 'getUserById').resolves(mockUser);
      sandbox.stub(registrationRepository, 'findByParticipantAndEvent').resolves(null);
      sandbox.stub(registrationRepository, 'findWaitlistEntryByParticipantAndEvent').resolves(null);
      sandbox.stub(registrationRepository, 'getConfirmedRegistrationCount').resolves(100); // At capacity
      sandbox.stub(registrationRepository, 'createWaitlistEntry').resolves(mockWaitlistEntry);
      sandbox.stub(notificationService, 'notifyWaitlistConfirmation').resolves({});

      // Act
      const result = await eventService.registerForEvent(eventId, userId);

      // Assert
      expect(result.success).to.be.true;
      expect(result.message).to.equal('You are on the waitlist');
      expect(result.status).to.equal('waitlisted');
      expect(result.waitlistEntry).to.deep.equal(mockWaitlistEntry);
      expect(result.position).to.equal(5);
      expect(registrationRepository.createWaitlistEntry).to.have.been.calledOnceWith(
        userId,
        eventId
      );
      expect(notificationService.notifyWaitlistConfirmation).to.have.been.calledOnce;
    });
  });

  describe('registerForEvent - Full Branch (No Capacity, Waitlist Disabled)', () => {
    it('should throw "Event is Full" error when event is full and waitlist is disabled', async () => {
      // Arrange
      const eventId = 'event-123';
      const userId = 'user-123';
      
      const mockEvent = {
        event_id: eventId,
        title: 'Test Event',
        location: 'Test Location',
        capacity: 100,
        status: 'published',
        waitlist_enabled: false, // Waitlist disabled
        start_time: new Date()
      };

      const mockUser = {
        user_id: userId,
        email: 'user@example.com',
        name: 'Test User',
        role: 'participant'
      };

      // Stub repository methods
      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);
      sandbox.stub(registrationRepository, 'getUserById').resolves(mockUser);
      sandbox.stub(registrationRepository, 'findByParticipantAndEvent').resolves(null);
      sandbox.stub(registrationRepository, 'findWaitlistEntryByParticipantAndEvent').resolves(null);
      sandbox.stub(registrationRepository, 'getConfirmedRegistrationCount').resolves(100); // At capacity

      // Act & Assert
      try {
        await eventService.registerForEvent(eventId, userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Event is Full');
        expect(registrationRepository.createRegistration).to.not.have.been.called;
        expect(registrationRepository.createWaitlistEntry).to.not.have.been.called;
      }
    });
  });

  describe('registerForEvent - Error Cases', () => {
    it('should throw error when event is not found', async () => {
      // Arrange
      const eventId = 'non-existent-event';
      const userId = 'user-123';

      sandbox.stub(eventRepository, 'findById').resolves(null);

      // Act & Assert
      try {
        await eventService.registerForEvent(eventId, userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Event not found');
      }
    });

    it('should throw error when event is not published', async () => {
      // Arrange
      const eventId = 'event-123';
      const userId = 'user-123';
      
      const mockEvent = {
        event_id: eventId,
        status: 'draft' // Not published
      };

      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);

      // Act & Assert
      try {
        await eventService.registerForEvent(eventId, userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('not published');
      }
    });

    it('should throw error when user is already registered', async () => {
      // Arrange
      const eventId = 'event-123';
      const userId = 'user-123';
      
      const mockEvent = {
        event_id: eventId,
        status: 'published',
        capacity: 100
      };

      const mockUser = {
        user_id: userId
      };

      const mockExistingRegistration = {
        registration_id: 'reg-123',
        participant_id: userId,
        event_id: eventId
      };

      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);
      sandbox.stub(registrationRepository, 'getUserById').resolves(mockUser);
      sandbox.stub(registrationRepository, 'findByParticipantAndEvent').resolves(mockExistingRegistration);

      // Act & Assert
      try {
        await eventService.registerForEvent(eventId, userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Already registered for this event');
      }
    });

    it('should throw error when user is already on waitlist', async () => {
      // Arrange
      const eventId = 'event-123';
      const userId = 'user-123';
      
      const mockEvent = {
        event_id: eventId,
        status: 'published',
        capacity: 100
      };

      const mockUser = {
        user_id: userId
      };

      const mockExistingWaitlist = {
        entry_id: 'waitlist-123',
        participant_id: userId,
        event_id: eventId
      };

      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);
      sandbox.stub(registrationRepository, 'getUserById').resolves(mockUser);
      sandbox.stub(registrationRepository, 'findByParticipantAndEvent').resolves(null);
      sandbox.stub(registrationRepository, 'findWaitlistEntryByParticipantAndEvent').resolves(mockExistingWaitlist);

      // Act & Assert
      try {
        await eventService.registerForEvent(eventId, userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Already on waitlist for this event');
      }
    });
  });
});

