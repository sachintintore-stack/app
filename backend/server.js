const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Import database
const { sequelize, testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const studySessionRoutes = require('./routes/studySessions');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');

// Import services
const reminderService = require('./services/reminderService');

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to StudyFlow Pro API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      assignments: '/api/assignments',
      studySessions: '/api/study-sessions',
      payments: '/api/payments',
      users: '/api/users',
      analytics: '/api/analytics'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Schedule reminder checks every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running reminder check...');
  try {
    await reminderService.checkAndSendReminders();
  } catch (error) {
    console.error('Reminder check failed:', error);
  }
});

// Schedule daily streak check at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily streak check...');
  try {
    await reminderService.checkAndResetStreaks();
  } catch (error) {
    console.error('Streak check failed:', error);
  }
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           🚀 StudyFlow Pro Server Running! 🚀              ║
║                                                            ║
║   Server: http://localhost:${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}    ║
║   Database: PostgreSQL                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
