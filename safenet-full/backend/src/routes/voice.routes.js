const router = require('express').Router();
const twilio = require('twilio');
const SOS    = require('../models/sos.model');
const logger = require('../config/logger');

/**
 * GET /api/voice/twiml
 * Twilio fetches this URL when the contact picks up.
 * Returns TwiML XML telling Twilio what to speak.
 */
router.get('/twiml', (req, res) => {
  const {
    userName    = 'someone',
    contactName = 'there',
    lat         = '',
    lng         = '',
  } = req.query;

  const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '';

  const twiml = new twilio.twiml.VoiceResponse();

  // 1 second pause — give the person time to say hello
  twiml.pause({ length: 1 });

  const message =
    `Hello, ${contactName}. ` +
    `This is an urgent emergency alert from SafeNet. ` +
    `${userName} has triggered an S.O.S. alert and may be in danger right now. ` +
    `Their live location has been sent to your phone as a text message. ` +
    `Please check your messages immediately and contact ${userName} or go to their location. ` +
    `This message will now repeat.`;

  // Repeat the message 3 times with pauses in between
  for (let i = 0; i < 3; i++) {
    twiml.say(
      {
        voice:    'Polly.Aditi',   // Indian English — change to 'alice' for US English
        language: 'en-IN',
      },
      message
    );
    if (i < 2) twiml.pause({ length: 3 });
  }

  twiml.say(
    { voice: 'Polly.Aditi', language: 'en-IN' },
    `If you have already reached ${userName} and they are safe, you may hang up. Thank you.`
  );

  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * POST /api/voice/status
 * Twilio calls this webhook when the call ends, reporting the outcome.
 * We use this to update the SOS record with call status.
 */
router.post('/status', async (req, res) => {
  const { sosId, contactId } = req.query;
  const { CallStatus, CallDuration, CallSid, To } = req.body;

  logger.info(`📞 Call status — SOS: ${sosId}, Contact: ${contactId}, Status: ${CallStatus}, Duration: ${CallDuration}s`);

  try {
    if (sosId && contactId) {
      await SOS.findByIdAndUpdate(
        sosId,
        {
          $set: {
            'notifiedContacts.$[elem].callStatus':   CallStatus,
            'notifiedContacts.$[elem].callDuration': parseInt(CallDuration) || 0,
            'notifiedContacts.$[elem].callSid':      CallSid,
            'notifiedContacts.$[elem].callPlaced':   true,
          },
        },
        {
          arrayFilters: [{ 'elem.contact': contactId }],
        }
      );
    }
  } catch (err) {
    logger.error(`Failed to update call status in DB: ${err.message}`);
  }

  // Always return 200 to Twilio
  res.sendStatus(200);
});

/**
 * POST /api/voice/test-call
 * Dev-only endpoint to manually trigger a test call.
 */
router.post('/test-call', async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Test calls not allowed in production.' });
  }

  try {
    const { to, userName = 'Test User', contactName = 'Friend' } = req.body;
    if (!to) return res.status(400).json({ error: 'to (phone number) is required.' });

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';

    const call = await client.calls.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      url:  `${BASE_URL}/api/voice/twiml?userName=${encodeURIComponent(userName)}&contactName=${encodeURIComponent(contactName)}`,
    });

    res.json({ message: 'Test call placed.', callSid: call.sid, status: call.status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
