const express = require('express');
console.log('✅ Express imported');

const cors = require('cors');
console.log('✅ CORS imported');

const multer = require('multer');
console.log('✅ Multer imported');

const path = require('path');
console.log('✅ Path imported');

const fs = require('fs');
console.log('✅ FS imported');

const helmet = require('helmet');
console.log('✅ Helmet imported');

require('dotenv').config();
console.log('✅ Dotenv configured');

// Create Express app
const app = express();
console.log('✅ Express app created');

const PORT = process.env.PORT || 5000;
console.log('✅ Port configured:', PORT);

// Security middleware
console.log('🔍 About to add helmet middleware');
app.use(helmet({crossOriginResourcePolicy: { policy: 'cross-origin' },contentSecurityPolicy: false }));
console.log('✅ Helmet middleware added');

// CORS configuration - Allow all for troubleshooting
console.log('🔍 About to add CORS middleware');
app.use(cors({
  origin: ['https://www.vetfile.ai', 'https://vetfile.ai', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
console.log('✅ CORS middleware added');

// Body parser middleware
console.log('🔍 About to add body parser middleware');
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
console.log('✅ Body parser middleware added');

// Ensure uploads directory exists
console.log('🔍 About to check uploads directory');
const uploadsDir = path.join(__dirname, '../uploads');
console.log('🔍 uploadsDir path:', uploadsDir);
if (!fs.existsSync(uploadsDir)) {
  console.log('🔍 Creating uploads directory');
  fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log('✅ Uploads directory setup complete');

// Import routes
console.log('🔍 About to import document routes');
const documentRoutes = require('./routes/documentRoutes');
console.log('✅ Document routes imported');

// Routes
console.log('🔍 About to setup routes');
app.use('/api/documents', documentRoutes);
console.log('✅ Routes setup complete');

// Health check route
console.log('🔍 About to setup health check route');
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: 'VetFile.ai API is running'
  });
});
console.log('✅ Health check route added');

// Simple home route
console.log('🔍 About to setup home route');
app.get('/', (req, res) => {
  res.status(200).send('VetFile.ai API Server - See /api/health for status');
});
console.log('✅ Home route added');

// Error handling middleware
console.log('🔍 About to add error handling middleware');
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Something went wrong',
      status: err.status || 500
    }
  });
});
console.log('✅ Error handling middleware added');

// Start server
console.log('🔍 About to start server');
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('✅ SERVER FULLY STARTED AND READY');
});
