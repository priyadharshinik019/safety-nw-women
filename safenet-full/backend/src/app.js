const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth.routes');
const sosRoutes       = require('./routes/sos.routes');
const locationRoutes  = require('./routes/location.routes');
const contactRoutes   = require('./routes/contact.routes');
const volunteerRoutes = require('./routes/volunteer.routes');
const voiceRoutes     = require('./routes/voice.routes');
const { errorHandler } = require('./middleware/error.middleware');
const logger = require('./config/logger');

const app = express();

// ── Security ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Logging ─────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Body Parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const sosLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'SOS rate limit exceeded. Wait a moment before retrying.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts. Try again in 15 minutes.' },
});

app.use('/api/', globalLimiter);

// ── Health Check ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SafeNet API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/sos',        sosLimiter,  sosRoutes);
app.use('/api/location',                locationRoutes);
app.use('/api/contacts',                contactRoutes);
app.use('/api/volunteers',              volunteerRoutes);
app.use('/api/voice',                   voiceRoutes);

// ── 404 ──────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ── Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
