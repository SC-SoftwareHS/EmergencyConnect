const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

// Routes
const authRoutes = require('./routes/authRoutes');
const alertRoutes = require('./routes/alertRoutes');
const userRoutes = require('./routes/userRoutes');
const incidentRoutes = require('./routes/incidentRoutes');

// Initialize database
const { initializeDatabase } = require('./utils/database');

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS settings
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database with sample data
initializeDatabase();

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
  // Handle user joining their personal room and role-based rooms
  socket.on('joinRoom', (userData) => {
    // If we just got a userId instead of a full object, handle legacy clients
    if (typeof userData === 'number' || typeof userData === 'string') {
      socket.join(`user-${userData}`);
      console.log(`User ${userData} joined their personal room`);
      return;
    }
    
    // Join personal room
    if (userData.id) {
      socket.join(`user-${userData.id}`);
      console.log(`User ${userData.id} joined their personal room`);
    }
    
    // Join role-based room
    if (userData.role) {
      socket.join(userData.role);
      console.log(`User ${userData.id} joined ${userData.role} room`);
    }
    
    // Send acknowledgment
    socket.emit('roomJoined', {
      userId: userData.id,
      role: userData.role,
      success: true
    });
  });
  
  // Handle alerts acknowledgment
  socket.on('acknowledgeAlert', (data) => {
    // Broadcast to admin and operator rooms that the alert was acknowledged
    io.to('admin').to('operator').emit('alertAcknowledged', {
      alertId: data.alertId,
      userId: data.userId,
      timestamp: new Date()
    });
    
    console.log(`Alert ${data.alertId} acknowledged by user ${data.userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

// Make io accessible to our routers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

module.exports = { app, server, io };
