const router  = require('express').Router();
const { body } = require('express-validator');
const {
  register, login, getMe, updateFCMToken, updateSettings, changePassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], register);

router.post('/login', login);

// Protected
router.get('/me',              protect, getMe);
router.patch('/fcm-token',     protect, updateFCMToken);
router.patch('/settings',      protect, updateSettings);
router.patch('/change-password', protect, changePassword);

module.exports = router;
