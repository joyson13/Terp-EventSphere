const request = require('supertest');
const sinon = require('sinon');
const { expect } = require('chai');
const app = require('../index');
const sendgridClient = require('../services/sendgridClient');

describe('Notifications API', () => {
  let stub;

  beforeEach(() => {
    stub = sinon.stub(sendgridClient, 'sendEmail').resolves([{ statusCode: 202 }]);
  });

  afterEach(() => {
    stub.restore();
  });

  it('sends registration confirmation', async () => {
    const payload = {
      eventId: 'e1',
      eventTitle: 'Test Event',
      eventLocation: 'Hall 1',
      eventStartTime: '2025-12-01 10:00',
      participantEmail: 'dev@example.com',
      participantName: 'Dev',
      registrationId: 'reg1'
    };

    const res = await request(app).post('/api/notifications/registration-confirmed').send(payload);
    expect(res.statusCode).to.equal(200);
    expect(res.body.status).to.equal('ok');
    sinon.assert.calledOnce(sendgridClient.sendEmail);
  });

  it('sends waitlist confirmed', async () => {
    const payload = {
      eventId: 'e1',
      eventTitle: 'Test Event',
      participantEmail: 'dev@example.com',
      participantName: 'Dev',
      waitlistEntryId: 'w1',
      position: 3
    };

    const res = await request(app).post('/api/notifications/waitlist-confirmed').send(payload);
    expect(res.statusCode).to.equal(200);
    expect(res.body.status).to.equal('ok');
    sinon.assert.calledOnce(sendgridClient.sendEmail);
  });

  it('sends waitlist success', async () => {
    const payload = {
      eventId: 'e1',
      eventTitle: 'Test Event',
      participantEmail: 'dev@example.com',
      participantName: 'Dev',
      registrationId: 'reg1',
      qrCodeData: 'AAAA'
    };

    const res = await request(app).post('/api/notifications/waitlist-success').send(payload);
    expect(res.statusCode).to.equal(200);
    expect(res.body.status).to.equal('ok');
    sinon.assert.calledOnce(sendgridClient.sendEmail);
  });

  it('sends event cancelled to participants', async () => {
    const payload = {
      eventId: 'e1',
      eventTitle: 'Test Event',
      eventLocation: 'Hall 1',
      eventStartTime: '2025-12-01 10:00',
      participants: [
        { participantId: 'p1', participantName: 'Dev', participantEmail: 'dev@example.com' },
        { participantId: 'p2', participantName: 'Alice', participantEmail: 'alice@example.com' }
      ]
    };

    const res = await request(app).post('/api/notifications/event-cancelled').send(payload);
    expect(res.statusCode).to.equal(200);
    expect(res.body.status).to.equal('ok');
    sinon.assert.calledTwice(sendgridClient.sendEmail);
  });
});