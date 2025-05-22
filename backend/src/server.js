const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
require('dotenv').config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({crossOriginResourcePolicy: { policy: 'cross-origin' },contentSecurityPolicy: false }));
// CORS configuration - Allow all for troubleshooting
app.use(cors({
  origin: ['https://www.vetfile.ai', 'https://vetfile.ai', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
console.log('Debug: About to check uploads directory');
const uploadsDir = path.join(__dirname, '../uploads');
console.log('Debug: uploadsDir path:', uploadsDir);
if (!fs.existsSync(uploadsDir)) {
  console.log('Debug: Creating uploads directory');
  fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log('Debug: Uploads directory setup complete');
// Import routes
const documentRoutes = require('./routes/documentRoutes');

// Routes
app.use('/api/documents', documentRoutes);
// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: 'VetFile.ai API is running'
  });
});

// Simple home route
app.get('/', (req, res) => {
  res.status(200).send('VetFile.ai API Server - See /api/health for status');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Something went wrong',
      status: err.status || 500
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
