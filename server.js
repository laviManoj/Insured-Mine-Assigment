const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const agentRoutes = require('./routes/agentRoutes');
const userRoutes = require('./routes/userRoutes');
const policyRoutes = require('./routes/policyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

connectDB();

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

// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/upload', uploadRoutes);


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Insurance Policy Management API is running',
    timestamp: new Date().toISOString()
  });
});


app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Insurance Policy Management API',
    version: '1.0.0',
    endpoints: {
      agents: '/api/agents',
      users: '/api/users',
      policies: '/api/policies',
      upload: '/api/upload'
    }
  });
});


app.use(errorHandler);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;