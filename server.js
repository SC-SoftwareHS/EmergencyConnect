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
const templateRoutes = require('./routes/templateRoutes');
const debugRoutes = require('./routes/debugRoutes');
const mobileDebugRoutes = require('./routes/mobileDebugRoutes');

// Initialize database
const { db, pool } = require('./db');

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS settings and authentication
const jwt = require('jsonwebtoken');
const schema = require('./shared/schema');
const { eq } = require('drizzle-orm');
const JWT_SECRET = process.env.JWT_SECRET || 'emergency-alert-system-secret-key';

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  // Check for authentication token in handshake
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    return next(new Error('Authentication token is required'));
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find the user from the database
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, decoded.userId));
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    // Attach user data to the socket
    socket.user = user;
    
    next();
  } catch (error) {
    return next(new Error('Invalid or expired token'));
  }
});

// Middleware - Enhanced CORS settings for mobile app
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Log and handle preflight requests
app.options('*', (req, res) => {
  console.log('Received preflight request from:', req.headers.origin);
  res.status(200).end();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Check for required API keys and service credentials
const hasTwilioCredentials = process.env.TWILIO_ACCOUNT_SID && 
                           process.env.TWILIO_AUTH_TOKEN && 
                           process.env.TWILIO_PHONE_NUMBER;
const hasSendGridKey = !!process.env.SENDGRID_API_KEY;

// Log available services
console.log('------------------------');
console.log('Available Services:');
console.log(`- SMS Notifications (Twilio): ${hasTwilioCredentials ? 'Available' : 'Not configured'}`);
console.log(`- Email Notifications (SendGrid): ${hasSendGridKey ? 'Available' : 'Not configured'}`);
console.log('------------------------');

// Using PostgreSQL database instead of in-memory database
console.log('Using PostgreSQL database');

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
  // For authenticated connections, join appropriate rooms automatically
  if (socket.user) {
    // Join personal room
    socket.join(`user-${socket.user.id}`);
    console.log(`User ${socket.user.id} automatically joined their personal room`);
    
    // Join role-based room
    socket.join(socket.user.role);
    console.log(`User ${socket.user.id} automatically joined ${socket.user.role} room`);
    
    // Send connection confirmation
    socket.emit('connected', {
      userId: socket.user.id,
      role: socket.user.role,
      success: true
    });
  }
  
  // Handle user joining their personal room and role-based rooms (legacy support)
  socket.on('joinRoom', (userData) => {
    // If user is already authenticated via middleware, use that data
    if (socket.user) {
      // Send acknowledgment using middleware user data
      socket.emit('roomJoined', {
        userId: socket.user.id,
        role: socket.user.role,
        success: true
      });
      return;
    }
    
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
  socket.on('acknowledgeAlert', async (data) => {
    // If authenticated, use socket.user
    const userId = socket.user ? socket.user.id : data.userId;
    const timestamp = new Date();
    
    try {
      // Store acknowledgment in the database
      await db.insert(schema.alertAcknowledgments).values({
        alertId: data.alertId,
        userId: userId,
        acknowledgedAt: timestamp,
        notes: data.notes || 'Acknowledged from mobile app'
      });
      
      // Broadcast to admin and operator rooms that the alert was acknowledged
      io.to('admin').to('operator').emit('alertAcknowledged', {
        alertId: data.alertId,
        userId: userId,
        timestamp: timestamp
      });
      
      console.log(`Alert ${data.alertId} acknowledged by user ${userId}`);
    } catch (error) {
      console.error(`Error acknowledging alert: ${error.message}`);
      socket.emit('error', { message: 'Failed to acknowledge alert' });
    }
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
app.use('/api/templates', templateRoutes);
app.use('/api/debug', debugRoutes);
app.use('/mobile-debug', mobileDebugRoutes);

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
