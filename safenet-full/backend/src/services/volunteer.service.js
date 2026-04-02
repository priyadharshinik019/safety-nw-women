const User = require('../models/user.model');
const logger = require('../config/logger');

const RADIUS = parseInt(process.env.VOLUNTEER_SEARCH_RADIUS) || 500; // metres

/**
 * Find verified volunteers within RADIUS metres of coordinates [lng, lat].
 * Uses MongoDB $near with 2dsphere index — extremely fast.
 */
const findNearby = async ([lng, lat]) => {
  try {
    const volunteers = await User.find({
      isVolunteer: true,
      isVerified:  true,
      isActive:    true,
      'location.updatedAt': { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // active in last 30 min
      location: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: RADIUS,
        },
      },
    })
      .limit(10)
      .select('name phone fcmToken location');

    logger.info(`Found ${volunteers.length} volunteers within ${RADIUS}m of [${lng}, ${lat}]`);
    return volunteers;
  } catch (err) {
    logger.error(`Volunteer proximity search failed: ${err.message}`);
    return [];
  }
};

// ── PATCH /api/volunteers/register ───────────────────────────────
const registerVolunteer = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isVolunteer: true,
      isVerified:  true, // auto-verify for now; add ID verification flow in production
    });
    res.json({ message: 'You are now registered as a SafeNet volunteer. Thank you! 🤝' });
  } catch (err) { next(err); }
};

// ── DELETE /api/volunteers/unregister ────────────────────────────
const unregisterVolunteer = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isVolunteer: false });
    res.json({ message: 'Volunteer registration removed.' });
  } catch (err) { next(err); }
};

// ── POST /api/volunteers/respond/:sosId ──────────────────────────
const respondToSOS = async (req, res, next) => {
  try {
    const SOS = require('../models/sos.model');
    const sos = await SOS.findById(req.params.sosId);

    if (!sos || sos.status !== 'active') {
      return res.status(404).json({ error: 'Active SOS not found.' });
    }

    const entry = sos.notifiedVolunteers.find(
      (v) => String(v.volunteer) === String(req.user._id)
    );

    if (entry) {
      entry.responded   = true;
      entry.respondedAt = new Date();
      await sos.save();
    }

    // Broadcast volunteer response to watchers
    const { getIO } = require('../sockets/socket');
    getIO().to(`sos:${sos._id}`).emit('volunteer:responding', {
      volunteerName: req.user.name,
      volunteerPhone: req.user.phone,
      sosId: sos._id,
    });

    res.json({ message: 'Response recorded. Please proceed to the location immediately.' });
  } catch (err) { next(err); }
};

// ── GET /api/volunteers/nearby?lng=&lat= ─────────────────────────
const getNearbyVolunteers = async (req, res, next) => {
  try {
    const { lng, lat } = req.query;
    if (!lng || !lat) return res.status(400).json({ error: 'lng and lat are required.' });
    const volunteers = await findNearby([parseFloat(lng), parseFloat(lat)]);
    res.json({ count: volunteers.length, volunteers });
  } catch (err) { next(err); }
};

module.exports = { findNearby, registerVolunteer, unregisterVolunteer, respondToSOS, getNearbyVolunteers };
