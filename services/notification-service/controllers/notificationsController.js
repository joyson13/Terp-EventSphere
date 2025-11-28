const sendgridClient = require('../services/sendgridClient');

// Basic input validation helpers
function getField(obj, key, defaultVal = null) {
  return obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : defaultVal;
}

exports.handleRegistrationConfirmed = async (req, res) => {
  try {
    const payload = req.body;

    const { eventId, eventTitle, eventLocation, eventStartTime, participantEmail, participantName, registrationId, qrCodeData } = payload;

    if (!participantEmail || !eventId || !registrationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const msg = {
      to: participantEmail,
      subject: `You're registered for ${eventTitle}`,
      text: `Hi ${participantName || ''},\n\nYou're confirmed for ${eventTitle} at ${eventStartTime} in ${eventLocation}. Registration ID: ${registrationId}.\n\nPlease bring this QR code if needed.`,
      html: `<p>Hi ${participantName || ''},</p><p>You're confirmed for <strong>${eventTitle}</strong> at ${eventStartTime} in ${eventLocation}.</p><p>Registration ID: ${registrationId}</p>` + (qrCodeData ? `<p><img alt="qr" src="data:image/png;base64,${qrCodeData}"/></p>` : '')
    };

    const response = await sendgridClient.sendEmail(msg);

    return res.json({ status: 'ok', result: response });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};

exports.handleWaitlistConfirmed = async (req, res) => {
  try {
    const payload = req.body;
    const { eventId, eventTitle, participantEmail, participantName, waitlistEntryId, position } = payload;

    if (!participantEmail || !eventId || !waitlistEntryId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const msg = {
      to: participantEmail,
      subject: `You're on the waitlist for ${eventTitle}`,
      text: `Hi ${participantName || ''},\n\nYou've been added to the waitlist (position ${position}) for ${eventTitle}. Your waitlist entry ID: ${waitlistEntryId}.`,
      html: `<p>Hi ${participantName || ''},</p><p>You've been added to the waitlist (position ${position}) for <strong>${eventTitle}</strong>.</p><p>Entry ID: ${waitlistEntryId}</p>`
    };

    const response = await sendgridClient.sendEmail(msg);

    return res.json({ status: 'ok', result: response });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};

exports.handleWaitlistSuccess = async (req, res) => {
  try {
    const payload = req.body;
    const { eventId, eventTitle, participantEmail, participantName, registrationId, qrCodeData } = payload;

    if (!participantEmail || !eventId || !registrationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const msg = {
      to: participantEmail,
      subject: `You're in for ${eventTitle} — see you there!`,
      text: `Hi ${participantName || ''},\n\nGreat news — you're in! Your registration ID: ${registrationId} for ${eventTitle}.\n\nPlease bring the attached QR code to check-in.`,
      html: `<p>Hi ${participantName || ''},</p><p>Great news — you're in for <strong>${eventTitle}</strong>!</p><p>Registration ID:${registrationId}</p>` + (qrCodeData ? `<p><img alt="qr" src="data:image/png;base64,${qrCodeData}"/></p>` : '')
    };

    const response = await sendgridClient.sendEmail(msg);

    return res.json({ status: 'ok', result: response });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};

exports.handleEventCancelled = async (req, res) => {
  try {
    const payload = req.body;
    const { eventId, eventTitle, eventLocation, eventStartTime, participants } = payload;

    if (!eventId || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send emails to all participants
    const results = [];
    for (const p of participants) {
      const msg = {
        to: p.participantEmail,
        subject: `Event cancelled: ${eventTitle}`,
        text: `Hi ${p.participantName || ''},\n\nWe're sorry — ${eventTitle} scheduled at ${eventStartTime} has been cancelled.`,
        html: `<p>Hi ${p.participantName || ''},</p><p>We're sorry — <strong>${eventTitle}</strong> scheduled at ${eventStartTime} has been cancelled.</p>`
      };

      try {
        const result = await sendgridClient.sendEmail(msg);
        results.push({ participantId: p.participantId, status: 'sent', result });
      } catch (err) {
        console.error(`Failed to send to ${p.participantEmail}:`, err.message);
        results.push({ participantId: p.participantId, status: 'failed', error: err.message });
      }
    }

    return res.json({ status: 'ok', results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send cancellation emails' });
  }
};
