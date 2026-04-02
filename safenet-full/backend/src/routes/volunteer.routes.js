const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const {
  registerVolunteer, unregisterVolunteer, respondToSOS, getNearbyVolunteers,
} = require('../services/volunteer.service');

router.use(protect);

router.patch('/register',         registerVolunteer);
router.delete('/unregister',      unregisterVolunteer);
router.post('/respond/:sosId',    respondToSOS);
router.get('/nearby',             getNearbyVolunteers);

module.exports = router;
