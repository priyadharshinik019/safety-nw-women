const twilio = require('twilio');
const logger = require('../config/logger');

let twilioClient;
const getTwilio = () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

const BASE_URL  = process.env.SERVER_URL || 'http://localhost:5000';
const STAGGER   = parseInt(process.env.CALL_STAGGER_DELAY) || 5000;

/**
 * Place a single voice call to one contact.
 * Twilio fetches TwiML from our /api/voice/twiml endpoint
 * to know what message to speak when the call is answered.
 */
const callContact = async ({ contact, user, sosId, coordinates }) => {
  const client = getTwilio();
  if (!client) {
    logger.warn('Twilio not configured — skipping call');
    return { contactId: contact._id, name: contact.name, success: false, reason: 'not_configured' };
  }

  const twimlUrl =
    `${BASE_URL}/api/voice/twiml` +
    `?userName=${encodeURIComponent(user.name)}` +
    `&contactName=${encodeURIComponent(contact.name)}` +
    `&lat=${coordinates[1]}&lng=${coordinates[0]}`;

  const statusCallbackUrl =
    `${BASE_URL}/api/voice/status?sosId=${sosId}&contactId=${contact._id}`;

  try {
    const call = await client.calls.create({
      to:                   contact.phone,
      from:                 process.env.TWILIO_PHONE_NUMBER,
      url:                  twimlUrl,
      statusCallback:       statusCallbackUrl,
      statusCallbackMethod: 'POST',
      statusCallbackEvent:  ['completed', 'no-answer', 'busy', 'failed'],
      timeout:              30,           // ring for 30 seconds before giving up
      machineDetection:     'DetectMessageEnd',
    });

    logger.info(`📞 Call placed → ${contact.name} (${contact.phone}) SID: ${call.sid}`);
    return { contactId: contact._id, name: contact.name, success: true, callSid: call.sid };
  } catch (err) {
    logger.error(`📞 Call failed → ${contact.name}: ${err.message}`);
    return { contactId: contact._id, name: contact.name, success: false, reason: err.message };
  }
};

/**
 * Call all contacts who have notifyByCall=true,
 * staggered by STAGGER ms so Priya (priority 1) rings first.
 */
const callAllContacts = async ({ contacts, user, sosId, coordinates }) => {
  const results = [];
  const callableContacts = contacts.filter((c) => c.notifyByCall && c.phone);

  for (let i = 0; i < callableContacts.length; i++) {
    if (i > 0) await delay(STAGGER);

    const result = await callContact({
      contact: callableContacts[i],
      user,
      sosId,
      coordinates,
    });
    results.push(result);
  }

  return results;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { callContact, callAllContacts };
