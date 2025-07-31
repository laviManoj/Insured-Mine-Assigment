const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
// const errorHandler = require('./middleware/errorHandler');

// Import existing routes
const agentRoutes = require('./routes/agentRoutes');
const userRoutes = require('./routes/userRoutes');
const policyRoutes = require('./routes/policyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Import new modules for Task 2
const CPUMonitor = require('./cpuMonitor');
const SchedulerService = require('./schedulerService');

const app = express();

// Global variables for Task 2
let cpuMonitor;
let schedulerService;
let db;

// Initialize database and new services
async function initializeServices() {
  try {
    // Connect to database
    await connectDB();
    
    // Get database instance from mongoose connection
    db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database instance not available');
    }
    
    console.log('📊 Database instance obtained for Task 2 services');

    // Add small delay to ensure connection is ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Initialize CPU Monitor with 70% threshold
    cpuMonitor = new CPUMonitor(70, 5000); // 70% threshold, check every 5 seconds
    
    // Initialize Scheduler Service
    schedulerService = new SchedulerService(db);

    // Start CPU monitoring with custom restart callback
    cpuMonitor.startMonitoring((cpuUsage) => {
      console.log(`🚨 High CPU usage detected: ${cpuUsage.toFixed(2)}%`);
      console.log('🔄 Performing graceful shutdown...');
      
      // Graceful shutdown
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    });

    console.log('🚀 Task 2 services initialized successfully');
    console.log(`🔍 CPU monitoring active with ${cpuMonitor.threshold}% threshold`);
    console.log(`📅 Message scheduler service initialized`);

  } catch (error) {
    console.error('❌ Error initializing Task 2 services:', error);
    // Don't exit - let the app run without Task 2 features if there's an issue
  }
}

// Initialize services
initializeServices();

// Existing middleware
app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json({ limit: process.env.UPLOAD_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.UPLOAD_LIMIT || '10mb' }));

// Existing Routes
app.use('/api/agents', agentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/upload', uploadRoutes);

// NEW ROUTES FOR TASK 2

// CPU Monitoring Routes
app.get('/api/system/cpu', async (req, res) => {
  try {
    if (!cpuMonitor) {
      return res.status(503).json({ error: 'CPU monitoring service not available' });
    }
    
    const cpuInfo = await cpuMonitor.getCurrentCPUInfo();
    res.json({
      success: true,
      data: cpuInfo,
      monitoring: cpuMonitor.monitoring
    });
  } catch (error) {
    console.error('Error getting CPU info:', error);
    res.status(500).json({ error: 'Failed to get CPU information' });
  }
});

app.post('/api/system/cpu/start-monitoring', (req, res) => {
  try {
    if (!cpuMonitor) {
      return res.status(503).json({ error: 'CPU monitoring service not available' });
    }
    
    if (!cpuMonitor.monitoring) {
      cpuMonitor.startMonitoring();
      res.json({ success: true, message: 'CPU monitoring started' });
    } else {
      res.json({ success: true, message: 'CPU monitoring already running' });
    }
  } catch (error) {
    console.error('Error starting CPU monitoring:', error);
    res.status(500).json({ error: 'Failed to start CPU monitoring' });
  }
});

app.post('/api/system/cpu/stop-monitoring', (req, res) => {
  try {
    if (!cpuMonitor) {
      return res.status(503).json({ error: 'CPU monitoring service not available' });
    }
    
    cpuMonitor.stopMonitoring();
    res.json({ success: true, message: 'CPU monitoring stopped' });
  } catch (error) {
    console.error('Error stopping CPU monitoring:', error);
    res.status(500).json({ error: 'Failed to stop CPU monitoring' });
  }
});

// Message Scheduling Routes
app.post('/api/schedule-message', async (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(503).json({ error: 'Scheduler service not available' });
    }
    
    const { message, day, time } = req.body;

    if (!message || !day || !time) {
      return res.status(400).json({ 
        error: 'Missing required fields. Please provide message, day (YYYY-MM-DD), and time (HH:MM)' 
      });
    }

    const result = await schedulerService.scheduleMessage(message, day, time);
    res.status(201).json(result);

  } catch (error) {
    console.error('Error scheduling message:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to schedule message' 
    });
  }
});

app.get('/api/scheduled-messages', async (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(503).json({ error: 'Scheduler service not available' });
    }
    
    const { status } = req.query;
    const messages = await schedulerService.getScheduledMessages(status);
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled messages' });
  }
});

app.delete('/api/scheduled-messages/:id', async (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(503).json({ error: 'Scheduler service not available' });
    }
    
    const { id } = req.params;
    const result = await schedulerService.cancelScheduledMessage(id);
    res.json(result);
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to cancel scheduled message' 
    });
  }
});

app.get('/api/scheduler/stats', async (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(503).json({ error: 'Scheduler service not available' });
    }
    
    const stats = await schedulerService.getSchedulerStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching scheduler stats:', error);
    res.status(500).json({ error: 'Failed to fetch scheduler statistics' });
  }
});

// Enhanced Health Check (includes Task 2 services)
app.get('/health', async (req, res) => {
  try {
    const healthData = {
      status: 'OK',
      message: 'Insurance Policy Management API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'Connected',
        api: 'Running'
      }
    };

    // Add CPU monitoring status if available
    if (cpuMonitor) {
      try {
        const cpuInfo = await cpuMonitor.getCurrentCPUInfo();
        healthData.services.cpuMonitor = {
          status: cpuMonitor.monitoring ? 'Active' : 'Inactive',
          usage: cpuInfo.usage + '%',
          threshold: cpuInfo.threshold + '%'
        };
      } catch (error) {
        healthData.services.cpuMonitor = 'Error';
      }
    }

    // Add scheduler status if available
    if (schedulerService) {
      try {
        const schedulerStats = await schedulerService.getSchedulerStats();
        healthData.services.scheduler = {
          status: 'Active',
          activeJobs: schedulerStats.activeJobs,
          totalMessages: schedulerStats.total
        };
      } catch (error) {
        healthData.services.scheduler = 'Error';
      }
    }

    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Existing root route (enhanced with Task 2 endpoints)
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Insurance Policy Management API',
    version: '1.0.0',
    endpoints: {
      // Existing endpoints
      agents: '/api/agents',
      users: '/api/users',
      policies: '/api/policies',
      upload: '/api/upload',
      // New Task 2 endpoints
      systemCpu: '/api/system/cpu',
      scheduleMessage: '/api/schedule-message',
      scheduledMessages: '/api/scheduled-messages',
      schedulerStats: '/api/scheduler/stats',
      health: '/health'
    },
    features: {
      cpuMonitoring: cpuMonitor ? 'Available' : 'Unavailable',
      messageScheduling: schedulerService ? 'Available' : 'Unavailable'
    }
  });
});

// Existing error handling
// app.use(errorHandler);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Graceful shutdown handlers for Task 2
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  
  if (cpuMonitor) {
    cpuMonitor.stopMonitoring();
  }
  
  // Add any database cleanup if needed
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  
  if (cpuMonitor) {
    cpuMonitor.stopMonitoring();
  }
  
  // Add any database cleanup if needed
  process.exit(0);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;