const router = require('express').Router();
const {
  triggerSOS, resolveSOS, cancelSOS, getActiveSOS, getSOSHistory, getSOSById,
} = require('../controllers/sos.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/trigger',       triggerSOS);
router.patch('/:id/resolve',  resolveSOS);
router.patch('/:id/cancel',   cancelSOS);
router.get('/active',         getActiveSOS);
router.get('/history',        getSOSHistory);
router.get('/:id',            getSOSById);

module.exports = router;
