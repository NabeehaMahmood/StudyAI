// backend/src/server.js
// Express application entry point with Socket.io for real-time session management

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const config = require('./config');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const User = require('./models/User');

// Route imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const healthRoutes = require('./routes/healthRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

// Create HTTP server for Socket.io
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    credentials: true,
  },
  cookie: true,
});

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure logs directory exists
const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ── Routes ─────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contact', contactRoutes);

// ── Error handling ─────────────────────────────────────
app.use(errorHandler);

// ── Socket.io configuration ────────────────────────────

// Track user session timers
const userSessionTimers = new Map();
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Extract JWT from cookies
function extractTokenFromCookie(cookie) {
  if (!cookie) return null;
  const cookies = cookie.split(';').map(c => c.trim());
  for (const c of cookies) {
    if (c.startsWith('token=')) {
      return c.slice(6);
    }
  }
  return null;
}

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = extractTokenFromCookie(socket.handshake.headers.cookie);
    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    next();
  } catch (err) {
    logger.error('Socket authentication failed:', err.message);
    next(new Error('Authentication failed'));
  }
});

// Socket connection handler
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.userId}`);

  // Set up inactivity timer for this socket
  const resetInactivityTimer = () => {
    // Clear existing timer if any
    if (userSessionTimers.has(socket.userId)) {
      clearTimeout(userSessionTimers.get(socket.userId));
    }

    // Set new timer (5 minutes)
    const timer = setTimeout(() => {
      logger.warn(`Session expired due to inactivity: ${socket.userId}`);
      socket.emit('session:expired', { reason: 'inactivity' });
      socket.disconnect(true);
      userSessionTimers.delete(socket.userId);
    }, INACTIVITY_TIMEOUT);

    userSessionTimers.set(socket.userId, timer);
  };

  // Initialize timer on connection
  resetInactivityTimer();

  // Listen for activity events
  socket.on('user:activity', () => {
    resetInactivityTimer();
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.userId}`);
    if (userSessionTimers.has(socket.userId)) {
      clearTimeout(userSessionTimers.get(socket.userId));
      userSessionTimers.delete(socket.userId);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.userId}:`, error);
  });
});

// ── Start server ───────────────────────────────────────
const start = async () => {
  await connectDB();
  httpServer.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} [${config.nodeEnv}]`);
    logger.info(`LM Studio endpoint: ${config.lmStudio.baseUrl}`);
    logger.info(`ChromaDB endpoint: ${config.chromaUrl}`);
    logger.info(`Socket.io initialized on port ${config.port}`);
  });
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { app, httpServer, io };
