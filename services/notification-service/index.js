require('dotenv').config();
const express = require('express');
const cors = require('cors');
<<<<<<< HEAD
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const { initDatabase, getPool } = require('../../shared/db/config');
=======
const http = require('http');
const { Server } = require('socket.io');
const { initDatabase } = require('../../shared/db/config');
>>>>>>> 0a145dac583f605661b91a0e90e2c4e5c290222d

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3004;

<<<<<<< HEAD
// Initialize database
initDatabase();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  })
);
=======
// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
>>>>>>> 0a145dac583f605661b91a0e90e2c4e5c290222d

// Store user socket connections
const userSockets = new Map();

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  // Verify JWT token (simplified - in production, use proper JWT verification)
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userID;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`User ${userId} connected to notifications`);

  // Store socket connection
  userSockets.set(userId, socket);

  // Join user-specific room
  socket.join(`user:${userId}`);

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected from notifications`);
    userSockets.delete(userId);
  });
});

// Make io available to other modules
app.set('io', io);

// Routes
<<<<<<< HEAD
app.get('/health', async (req, res) => {
  try {
    // Ping database to ensure connection is healthy
    const pool = getPool();
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', service: 'notification-service' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
=======
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
>>>>>>> 0a145dac583f605661b91a0e90e2c4e5c290222d
});

// Import routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

// Broadcast endpoint for other services to trigger WebSocket notifications
app.post('/api/notifications/broadcast', (req, res) => {
  const { notification } = req.body;
  if (!notification || !notification.user_id) {
    return res.status(400).json({ error: 'Invalid notification data' });
  }
  
  // Send via WebSocket
  io.to(`user:${notification.user_id}`).emit('notification', notification);
  res.json({ success: true });
});

// Helper function to send notification via WebSocket
const sendNotification = (userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

// Make sendNotification available globally
app.set('sendNotification', sendNotification);

server.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});

module.exports = { app, io, sendNotification };

