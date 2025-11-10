const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();

// Import passport config
require('./config/passport');

const app = express();

// CORS configuration - include all your frontend URLs
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Test Strapi connection with detailed info
app.get('/api/test-strapi', async (req, res) => {
  try {
    const strapiService = require('./services/strapi');
    const connectionStatus = await strapiService.testConnection();
    
    if (connectionStatus) {
      res.json({ 
        strapiStatus: 'connected',
        message: 'Strapi connection successful - all endpoints accessible'
      });
    } else {
      res.status(500).json({ 
        strapiStatus: 'error',
        message: 'Strapi connection failed - check API endpoints'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      strapiStatus: 'error',
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB (optional)
if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb')) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.log('MongoDB connection skipped - using Strapi for user management');
}

const PORT = process.env.PORT || 5000;

// Test Strapi connection on startup
async function initializeServer() {
  try {
    const strapiService = require('./services/strapi');
    console.log('Testing Strapi connection on startup...');
    const connectionStatus = await strapiService.testConnection();
    
    if (connectionStatus) {
      console.log('✅ Strapi connection successful');
    } else {
      console.log('❌ Strapi connection failed - check your Strapi setup');
    }
  } catch (error) {
    console.log('Strapi connection test failed:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Strapi test: http://localhost:${PORT}/api/test-strapi`);
    console.log(`Google OAuth: http://localhost:${PORT}/api/auth/google`);
    console.log(`Facebook OAuth: http://localhost:${PORT}/api/auth/facebook`);
  });
}

initializeServer();