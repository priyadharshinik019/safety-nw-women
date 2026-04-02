import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect',        () => console.log('🔌 Socket connected'));
  socket.on('disconnect',     (r) => console.log('🔌 Socket disconnected:', r));
  socket.on('connect_error',  (e) => console.error('Socket error:', e.message));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const getSocket = () => socket;

// ── Helpers ──────────────────────────────────────────────────────
export const watchSOS   = (sosId) => socket?.emit('sos:watch',   { sosId });
export const unwatchSOS = (sosId) => socket?.emit('sos:unwatch', { sosId });

export const sendLocation = (sosId, coordinates) =>
  socket?.emit('location:update', { sosId, coordinates });

export const sendVolunteerLocation = (coordinates) =>
  socket?.emit('volunteer:location', { coordinates });
