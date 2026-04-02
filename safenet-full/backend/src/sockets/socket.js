const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const SOS = require('../models/sos.model');
const User = require('../models/user.model');
const logger = require('../config/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin:  process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout:  30000,
    pingInterval: 10000,
  });

  // ── JWT auth for every socket connection ─────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(decoded.id);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: user ${socket.userId}`);

    // Join personal room — others can emit to this user
    socket.join(`user:${socket.userId}`);

    // ── Send live GPS location during active SOS ─────────────────
    socket.on('location:update', async ({ sosId, coordinates }) => {
      try {
        const sos = await SOS.findOne({ _id: sosId, user: socket.userId, status: 'active' });
        if (!sos) return;

        // Add to trail (cap at 1000 points)
        sos.locationHistory.push({ coordinates, recordedAt: new Date() });
        if (sos.locationHistory.length > 1000) sos.locationHistory.shift();
        sos.location.coordinates = coordinates;
        await sos.save();

        // Update user's last known position
        await User.findByIdAndUpdate(socket.userId, {
          'location.coordinates': coordinates,
          'location.updatedAt':   new Date(),
        });

        // Broadcast to all watchers of this SOS
        socket.to(`sos:${sosId}`).emit('location:updated', {
          sosId,
          coordinates,
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error(`location:update error: ${err.message}`);
      }
    });

    // ── Join an SOS room to receive live location updates ────────
    socket.on('sos:watch', ({ sosId }) => {
      socket.join(`sos:${sosId}`);
      logger.info(`👁  User ${socket.userId} watching SOS ${sosId}`);
    });

    socket.on('sos:unwatch', ({ sosId }) => {
      socket.leave(`sos:${sosId}`);
    });

    // ── Volunteer sends their position for volunteer map ─────────
    socket.on('volunteer:location', async ({ coordinates }) => {
      try {
        await User.findByIdAndUpdate(socket.userId, {
          'location.coordinates': coordinates,
          'location.updatedAt':   new Date(),
        });
      } catch (err) {
        logger.error(`volunteer:location error: ${err.message}`);
      }
    });

    // ── Ping / keepalive ─────────────────────────────────────────
    socket.on('ping', () => socket.emit('pong', { time: new Date() }));

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: user ${socket.userId} — ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error (user ${socket.userId}): ${err.message}`);
    });
  });

  logger.info('🔗 Socket.io initialised');
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialised — call initSocket first');
  return io;
};

module.exports = { initSocket, getIO };
