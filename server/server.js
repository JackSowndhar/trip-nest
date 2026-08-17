const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketio = require('socket.io');
const connectDB = require('./config/db');
const Message = require('./models/Message');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join a trip chat room
  socket.on('joinTrip', ({ tripId }) => {
    socket.join(tripId);
    console.log(`👤 Socket ${socket.id} joined trip: ${tripId}`);
  });

  // Leave a trip chat room
  socket.on('leaveTrip', ({ tripId }) => {
    socket.leave(tripId);
    console.log(`👤 Socket ${socket.id} left trip: ${tripId}`);
  });

  // Handle messages
  socket.on('sendMessage', async ({ tripId, senderId, text, replyTo, file }) => {
    try {
      if (!tripId || !senderId || (!text?.trim() && !file)) return;

      const messageData = {
        trip: tripId,
        sender: senderId,
      };

      if (text?.trim()) {
        messageData.text = text.trim();
      }

      if (replyTo) {
        messageData.replyTo = replyTo;
      }

      if (file) {
        messageData.file = file;
      }

      let message = await Message.create(messageData);

      // Populate sender info
      message = await message.populate('sender', 'name email avatar');

      // Emit message to everyone in the room
      io.to(tripId).emit('message', message);
    } catch (error) {
      console.error('Error saving or emitting socket message:', error);
    }
  });

  // Handle message edit
  socket.on('editMessage', async ({ tripId, messageId, userId, text }) => {
    try {
      if (!tripId || !messageId || !userId || !text?.trim()) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      // Verify the sender is editing
      if (message.sender.toString() !== userId) return;

      message.text = text.trim();
      await message.save();

      const populatedMessage = await message.populate('sender', 'name email avatar');
      io.to(tripId).emit('messageEdited', populatedMessage);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  });

  // Handle message deletion
  socket.on('deleteMessage', async ({ tripId, messageId, userId }) => {
    try {
      if (!tripId || !messageId || !userId) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      // Verify the sender is deleting
      if (message.sender.toString() !== userId) return;

      await Message.findByIdAndDelete(messageId);
      io.to(tripId).emit('messageDeleted', { messageId });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/Trip'));
app.use('/api/trips/:tripId/members', require('./routes/Member'));
app.use('/api/trips/:tripId/expenses', require('./routes/Expense'));
app.use('/api/trips/:tripId/itinerary', require('./routes/Itinerary'));
app.use('/api/trips/:tripId/chat', require('./routes/Chat'));
app.use('/api/users', require('./routes/User'));
app.use('/api/invitations', require('./routes/Invitation'));


// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'TripNest API is running 🚀' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Global error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log(`\n🚀 TripNest Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🌿 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

