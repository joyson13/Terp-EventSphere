const { expect } = require('chai');
const sinon = require('sinon');
const eventService = require('../services/eventService');
const eventRepository = require('../repositories/eventRepository');

describe('EventService - Ownership Verification (AC-1)', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('updateEvent', () => {
    it('should allow organizer to update their own event', async () => {
      // Arrange
      const eventId = 'event-123';
      const organizerId = 'organizer-123';
      const eventData = { title: 'Updated Title' };
      
      const mockEvent = {
        event_id: eventId,
        organizer_id: organizerId,
        title: 'Original Title',
        status: 'draft'
      };

      const mockUpdatedEvent = {
        ...mockEvent,
        title: 'Updated Title'
      };

      // Stub repository methods
      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);
      sandbox.stub(eventRepository, 'update').resolves(mockUpdatedEvent);

      // Act
      const result = await eventService.updateEvent(eventId, eventData, organizerId);

      // Assert
      expect(result).to.deep.equal(mockUpdatedEvent);
      expect(eventRepository.findById).to.have.been.calledOnceWith(eventId);
      expect(eventRepository.update).to.have.been.calledOnceWith(eventId, eventData);
    });

    it('should reject update when organizer tries to update another organizer\'s event', async () => {
      // Arrange
      const eventId = 'event-123';
      const organizerId = 'organizer-123';
      const otherOrganizerId = 'organizer-456';
      const eventData = { title: 'Updated Title' };
      
      const mockEvent = {
        event_id: eventId,
        organizer_id: organizerId, // Event belongs to organizer-123
        title: 'Original Title',
        status: 'draft'
      };

      // Stub repository method
      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);

      // Act & Assert
      try {
        await eventService.updateEvent(eventId, eventData, otherOrganizerId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('permission');
        expect(error.message).to.include('Only the event organizer can update their own events');
        expect(eventRepository.findById).to.have.been.calledOnceWith(eventId);
        expect(eventRepository.update).to.not.have.been.called;
      }
    });

    it('should throw error when event does not exist', async () => {
      // Arrange
      const eventId = 'non-existent-event';
      const organizerId = 'organizer-123';
      const eventData = { title: 'Updated Title' };

      // Stub repository method
      sandbox.stub(eventRepository, 'findById').resolves(null);

      // Act & Assert
      try {
        await eventService.updateEvent(eventId, eventData, organizerId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Event not found');
        expect(eventRepository.findById).to.have.been.calledOnceWith(eventId);
        expect(eventRepository.update).to.not.have.been.called;
      }
    });

    it('should not allow status changes through update endpoint', async () => {
      // Arrange
      const eventId = 'event-123';
      const organizerId = 'organizer-123';
      const eventData = { 
        title: 'Updated Title',
        status: 'published' // Should be removed
      };
      
      const mockEvent = {
        event_id: eventId,
        organizer_id: organizerId,
        title: 'Original Title',
        status: 'draft'
      };

      const mockUpdatedEvent = {
        ...mockEvent,
        title: 'Updated Title'
      };

      // Stub repository methods
      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);
      sandbox.stub(eventRepository, 'update').resolves(mockUpdatedEvent);

      // Act
      const result = await eventService.updateEvent(eventId, eventData, organizerId);

      // Assert
      expect(result).to.deep.equal(mockUpdatedEvent);
      // Verify that status was removed from eventData before update
      const updateCall = eventRepository.update.getCall(0);
      expect(updateCall.args[1]).to.not.have.property('status');
    });
  });

  describe('publishEvent', () => {
    it('should allow organizer to publish their own draft event', async () => {
      // Arrange
      const eventId = 'event-123';
      const organizerId = 'organizer-123';
      
      const mockEvent = {
        event_id: eventId,
        organizer_id: organizerId,
        title: 'Test Event',
        status: 'draft'
      };

      const mockPublishedEvent = {
        ...mockEvent,
        status: 'published'
      };

      // Stub repository methods
      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);
      sandbox.stub(eventRepository, 'update').resolves(mockPublishedEvent);

      // Act
      const result = await eventService.publishEvent(eventId, organizerId);

      // Assert
      expect(result.status).to.equal('published');
      expect(eventRepository.update).to.have.been.calledOnceWith(eventId, { status: 'published' });
    });

    it('should reject publish when organizer tries to publish another organizer\'s event', async () => {
      // Arrange
      const eventId = 'event-123';
      const organizerId = 'organizer-123';
      const otherOrganizerId = 'organizer-456';
      
      const mockEvent = {
        event_id: eventId,
        organizer_id: organizerId,
        title: 'Test Event',
        status: 'draft'
      };

      // Stub repository method
      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);

      // Act & Assert
      try {
        await eventService.publishEvent(eventId, otherOrganizerId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('permission');
        expect(error.message).to.include('Only the event organizer can publish their own events');
        expect(eventRepository.update).to.not.have.been.called;
      }
    });
  });

  describe('cancelEvent', () => {
    it('should allow organizer to cancel their own event', async () => {
      // Arrange
      const eventId = 'event-123';
      const organizerId = 'organizer-123';
      
      const mockEvent = {
        event_id: eventId,
        organizer_id: organizerId,
        title: 'Test Event',
        status: 'published',
        start_time: new Date()
      };

      const mockCancelledEvent = {
        ...mockEvent,
        status: 'cancelled'
      };

      const mockRegistrations = [];

      // Stub repository methods
      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);
      sandbox.stub(eventRepository, 'update').resolves(mockCancelledEvent);
      sandbox.stub(eventRepository, 'getRegistrations').resolves(mockRegistrations);

      // Act
      const result = await eventService.cancelEvent(eventId, organizerId);

      // Assert
      expect(result.status).to.equal('cancelled');
      expect(eventRepository.update).to.have.been.calledOnceWith(eventId, { status: 'cancelled' });
    });

    it('should reject cancel when organizer tries to cancel another organizer\'s event', async () => {
      // Arrange
      const eventId = 'event-123';
      const organizerId = 'organizer-123';
      const otherOrganizerId = 'organizer-456';
      
      const mockEvent = {
        event_id: eventId,
        organizer_id: organizerId,
        title: 'Test Event',
        status: 'published'
      };

      // Stub repository method
      sandbox.stub(eventRepository, 'findById').resolves(mockEvent);

      // Act & Assert
      try {
        await eventService.cancelEvent(eventId, otherOrganizerId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('permission');
        expect(error.message).to.include('Only the event organizer can cancel their own events');
        expect(eventRepository.update).to.not.have.been.called;
      }
    });
  });
});

