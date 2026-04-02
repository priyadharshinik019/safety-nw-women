const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const logger = require('../config/logger');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── POST /api/auth/register ──────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({
        error: existing.email === email ? 'Email already registered.' : 'Phone already registered.',
      });
    }

    const user = await User.create({ name, phone, email, password });
    const token = signToken(user._id);

    logger.info(`New user registered: ${email}`);
    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isVolunteer: user.isVolunteer,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ─────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated.' });
    }

    const token = signToken(user._id);
    logger.info(`User logged in: ${email}`);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isVolunteer: user.isVolunteer,
        settings: user.settings,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ─────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/auth/fcm-token ────────────────────────────────────
const updateFCMToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ error: 'fcmToken is required.' });
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ message: 'FCM token updated.' });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/auth/settings ─────────────────────────────────────
const updateSettings = async (req, res, next) => {
  try {
    const allowed = ['voiceActivation', 'shakeActivation', 'autoCallPolice', 'escalationDelayMins'];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[`settings.${key}`] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    res.json({ message: 'Settings updated.', settings: user.settings });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/auth/change-password ─────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateFCMToken, updateSettings, changePassword };
