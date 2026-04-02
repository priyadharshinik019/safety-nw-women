const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const User = require('../models/user.model');

router.use(protect);

// PATCH /api/location/update — update user's current GPS position
router.patch('/update', async (req, res, next) => {
  try {
    const { coordinates } = req.body; // [lng, lat]
    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ error: 'coordinates [lng, lat] required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      'location.coordinates': coordinates,
      'location.updatedAt':   new Date(),
    });

    res.json({ message: 'Location updated.' });
  } catch (err) { next(err); }
});

module.exports = router;
