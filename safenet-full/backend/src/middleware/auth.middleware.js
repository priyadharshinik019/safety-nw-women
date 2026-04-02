const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../config/logger');

/**
 * Protect routes — verify JWT and attach req.user
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found.' });
    if (!user.isActive) return res.status(401).json({ error: 'Account deactivated.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    logger.error(`Auth middleware error: ${err.message}`);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

/**
 * Restrict to volunteer users only
 */
const requireVolunteer = (req, res, next) => {
  if (!req.user?.isVolunteer) {
    return res.status(403).json({ error: 'Volunteer access required.' });
  }
  next();
};

module.exports = { protect, requireVolunteer };
