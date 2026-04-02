const twilio = require('twilio');
const admin = require('firebase-admin');
const callService = require('./call.service');
const logger = require('../config/logger');

// ── Twilio client (lazy init) ────────────────────────────────────
let twilioClient;
const getTwilio = () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};




// ── Firebase Admin (lazy init) ───────────────────────────────────
let firebaseReady = false;
const getFirebase = () => {
  if (!firebaseReady && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    firebaseReady = true;
  }
  return firebaseReady ? admin : null;
};

const mapsLink = ([lng, lat]) => `https://maps.google.com/?q=${lat},${lng}`;

// ── Notify trusted contacts: SMS + Push + Phone Call ─────────────
const notifyContacts = async (contacts, user, sos, coordinates) => {
  const results = [];
  const link = mapsLink(coordinates);
  const client = getTwilio();
  const fb = getFirebase();

  for (const contact of contacts) {
    const entry = {
      contact:      contact._id,
      name:         contact.name,
      phone:        contact.phone,
      notifiedAt:   new Date(),
      smsDelivered: false,
      callPlaced:   false,
      callSid:      null,
      pushDelivered: false,
    };

    // 1️⃣  SMS
    if (contact.notifyBySMS && contact.phone && client) {
      try {
        const body =
          `🚨 EMERGENCY ALERT 🚨\n` +
          `${user.name} needs help RIGHT NOW!\n\n` +
          `📍 Live location:\n${link}\n\n` +
          `SOS ID: ${sos._id}\n` +
          `Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n` +
          `A phone call is coming — please pick up immediately.`;

        await client.messages.create({
          body,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone,
        });
        entry.smsDelivered = true;
        logger.info(`📱 SMS sent → ${contact.name} (${contact.phone})`);
      } catch (err) {
        logger.error(`SMS failed → ${contact.name}: ${err.message}`);
      }
    }

    // 2️⃣  Push notification
    if (contact.notifyByPush && contact.fcmToken && fb) {
      try {
        await fb.messaging().send({
          token: contact.fcmToken,
          notification: {
            title: `🚨 ${user.name} needs help!`,
            body:  'Tap to see live location and call them.',
          },
          data: {
            sosId:    String(sos._id),
            mapsLink: link,
            type:     'sos_contact',
          },
          android: { priority: 'high' },
          apns:    { payload: { aps: { sound: 'default', badge: 1, 'content-available': 1 } } },
        });
        entry.pushDelivered = true;
        logger.info(`🔔 Push sent → ${contact.name}`);
      } catch (err) {
        logger.error(`Push failed → ${contact.name}: ${err.message}`);
      }
    }

    results.push(entry);
  }

  // 3️⃣  Phone calls — run in background, staggered by priority
  if (contacts.some((c) => c.notifyByCall)) {
    callService
      .callAllContacts({ contacts, user, sosId: sos._id, coordinates })
      .then((callResults) => {
        logger.info(`📞 Call results: ${JSON.stringify(callResults)}`);
      })
      .catch((err) => logger.error(`callAllContacts error: ${err.message}`));
  }

  return results;
};

// ── Notify nearby volunteers (push only) ─────────────────────────
const notifyVolunteers = async (volunteers, user, sos, coordinates) => {
  const results = [];
  const fb = getFirebase();
  if (!fb) return results;

  const link = mapsLink(coordinates);

  for (const volunteer of volunteers) {
    if (!volunteer.fcmToken) continue;
    try {
      await fb.messaging().send({
        token: volunteer.fcmToken,
        notification: {
          title: '🚨 SafeNet: Someone needs help nearby',
          body:  `${user.name} is in danger within 500m of you. Tap to help.`,
        },
        data: {
          sosId:    String(sos._id),
          mapsLink: link,
          type:     'sos_volunteer',
        },
        android: { priority: 'high' },
        apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
      });
      results.push({ _id: volunteer._id, name: volunteer.name });
      logger.info(`🤝 Volunteer push → ${volunteer.name}`);
    } catch (err) {
      logger.error(`Volunteer push failed → ${volunteer._id}: ${err.message}`);
    }
  }

  return results;
};

// ── Notify contacts user is safe ─────────────────────────────────
const notifySafe = async (contacts, user) => {
  const client = getTwilio();
  const fb = getFirebase();

  for (const contact of contacts) {
    // Safe SMS
    if (contact.notifyBySMS && contact.phone && client) {
      try {
        await client.messages.create({
          body: `✅ SafeNet Update: ${user.name} is safe now. The SOS alert has been resolved. Thank you for being there. 💙`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to:   contact.phone,
        });
        logger.info(`✅ Safe SMS sent → ${contact.name}`);
      } catch (err) {
        logger.error(`Safe SMS failed → ${contact.name}: ${err.message}`);
      }
    }

    // Safe push
    if (contact.fcmToken && fb) {
      try {
        await fb.messaging().send({
          token: contact.fcmToken,
          notification: {
            title: `✅ ${user.name} is safe`,
            body:  'The SOS alert has been resolved.',
          },
          data: { type: 'sos_resolved' },
        });
      } catch (_) {}
    }
  }
};

module.exports = { notifyContacts, notifyVolunteers, notifySafe };
