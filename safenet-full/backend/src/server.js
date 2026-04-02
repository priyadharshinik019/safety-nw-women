require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./sockets/socket');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const { initWhatsApp } = require('./services/whatsapp.service');
const PORT = process.env.PORT || 5001;
connectDB();
const server = http.createServer(app);
initSocket(server);
initWhatsApp();
server.listen(PORT, () => {
  logger.info('SafeNet API running on port ' + PORT);
  logger.info('Health: http://localhost:' + PORT + '/health');
});
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('unhandledRejection', (err) => { logger.error(err.message); server.close(() => process.exit(1)); });
