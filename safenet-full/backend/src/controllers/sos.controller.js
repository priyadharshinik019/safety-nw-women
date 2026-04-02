const SOS = require('../models/sos.model');
const Contact = require('../models/contact.model');
const User = require('../models/user.model');
const notificationService = require('../services/notification.service');
const volunteerService = require('../services/volunteer.service');
const { sendWhatsAppSOS } = require('../services/whatsapp.service');
const { getIO } = require('../sockets/socket');
const logger = require('../config/logger');

const triggerSOS = async (req, res, next) => {
  try {
    const { coordinates, triggerMethod = 'button', address } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ error: 'coordinates [lng, lat] is required.' });
    }

    const existingActive = await SOS.findOne({ user: req.user._id, status: 'active' });
    if (existingActive) {
      return res.status(409).json({
        error: 'You already have an active SOS alert.',
        sosId: existingActive._id,
      });
    }

    const sos = await SOS.create({
      user: req.user._id,
      triggerMethod,
      location: {
        type: 'Point',
        coordinates,
        address: address || null,
      },
      locationHistory: [{ coordinates, recordedAt: new Date() }],
    });

    logger.info(`🚨 SOS triggered by ${req.user.name} via ${triggerMethod}`);

    res.status(201).json({
      message: 'SOS alert triggered. Notifying your contacts now.',
      sosId: sos._id,
    });

    // Run notifications in background
    (async () => {
      try {
        const contacts = await Contact.find({ owner: req.user._id }).sort('priority');
        const volunteers = await volunteerService.findNearby(coordinates);

        // Send WhatsApp messages FREE
        sendWhatsAppSOS(contacts, req.user, coordinates);

        const contactResults = await notificationService.notifyContacts(
          contacts, req.user, sos, coordinates
        );
        const volunteerResults = await notificationService.notifyVolunteers(
          volunteers, req.user, sos, coordinates
        );

        sos.notifiedContacts = contactResults;
        sos.notifiedVolunteers = volunteerResults.map((v) => ({
          volunteer: v._id,
          notifiedAt: new Date(),
        }));
        await sos.save();

        const io = getIO();
        contacts.forEach((c) => {
          io.to(`user:${c._id}`).emit('sos:active', {
            sosId: sos._id,
            user: { id: req.user._id, name: req.user.name, phone: req.user.phone },
            coordinates,
            triggerMethod,
            timestamp: new Date(),
          });
        });

        const delayMs = (req.user.settings?.escalationDelayMins || 2) * 60 * 1000;
        schedulePoliceEscalation(sos._id, delayMs);

      } catch (err) {
        logger.error(`SOS notification error: ${err.message}`);
      }
    })();

  } catch (err) {
    next(err);
  }
};

const resolveSOS = async (req, res, next) => {
  try {
    const sos = await SOS.findOne({ _id: req.params.id, user: req.user._id });
    if (!sos) return res.status(404).json({ error: 'SOS not found.' });
    if (sos.status !== 'active') return res.status(400).json({ error: `SOS is already ${sos.status}.` });

    sos.status = 'resolved';
    sos.resolvedAt = new Date();
    sos.resolvedBy = 'user';
    await sos.save();

    const contacts = await Contact.find({ owner: req.user._id });
    await notificationService.notifySafe(contacts, req.user);

    const io = getIO();
    contacts.forEach((c) => {
      io.to(`user:${c._id}`).emit('sos:resolved', {
        sosId: sos._id,
        userName: req.user.name,
        resolvedAt: sos.resolvedAt,
      });
    });

    res.json({ message: "You're marked as safe. Contacts notified." });
  } catch (err) {
    next(err);
  }
};

const cancelSOS = async (req, res, next) => {
  try {
    const sos = await SOS.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'active' },
      { status: 'cancelled', resolvedAt: new Date(), resolvedBy: 'user' },
      { new: true }
    );
    if (!sos) return res.status(404).json({ error: 'Active SOS not found.' });
    res.json({ message: 'SOS cancelled.' });
  } catch (err) {
    next(err);
  }
};

const getActiveSOS = async (req, res, next) => {
  try {
    const sos = await SOS.findOne({ user: req.user._id, status: 'active' })
      .populate('notifiedContacts.contact', 'name phone relationship')
      .populate('notifiedVolunteers.volunteer', 'name phone');
    res.json({ sos: sos || null });
  } catch (err) {
    next(err);
  }
};

const getSOSHistory = async (req, res, next) => {
  try {
    const history = await SOS.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('status triggerMethod location createdAt resolvedAt policeNotified notifiedContacts');
    res.json({ history, total: history.length });
  } catch (err) {
    next(err);
  }
};

const getSOSById = async (req, res, next) => {
  try {
    const sos = await SOS.findOne({ _id: req.params.id, user: req.user._id });
    if (!sos) return res.status(404).json({ error: 'SOS not found.' });
    res.json({ sos });
  } catch (err) {
    next(err);
  }
};

const schedulePoliceEscalation = (sosId, delayMs) => {
  setTimeout(async () => {
    try {
      const sos = await SOS.findById(sosId);
      if (!sos || sos.status !== 'active') return;
      sos.status = 'escalated';
      sos.policeNotified = true;
      sos.policeNotifiedAt = new Date();
      await sos.save();
      logger.warn(`⚠️ SOS ${sosId} escalated to police`);
    } catch (err) {
      logger.error(`Police escalation failed: ${err.message}`);
    }
  }, delayMs);
};

module.exports = { triggerSOS, resolveSOS, cancelSOS, getActiveSOS, getSOSHistory, getSOSById };