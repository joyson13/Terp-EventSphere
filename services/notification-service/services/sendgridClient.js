const sgMail = require('@sendgrid/mail');

const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@terpeventsphere.edu';
const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  console.warn('SENDGRID_API_KEY not set — emails will fail until configured.');
}

sgMail.setApiKey(apiKey);

exports.sendEmail = async (msg) => {
  const sendMsg = {
    from: fromEmail,
    ...msg
  };

  // Basic validation
  if (!sendMsg.to || !sendMsg.subject || (!sendMsg.text && !sendMsg.html)) {
    throw new Error('Invalid message payload');
  }

  const result = await sgMail.send(sendMsg);
  return result;
};
