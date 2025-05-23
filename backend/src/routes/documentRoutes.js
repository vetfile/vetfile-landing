// src/routes/documentRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const documentController = require('../controllers/documentController');

const router = express.Router();

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Configure file filter
const fileFilter = (req, file, cb) => {
  // Accept PDFs and images
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  }
});

// Routes
router.post('/upload', upload.array('documents', 10), documentController.uploadDocuments);
router.post('/process-pdf', upload.single('document'), documentController.processPDF);
router.post('/analyze/:uploadId', documentController.analyzeDocuments);
router.get('/analysis/:uploadId', documentController.getAnalysis);
router.post('/generate-form/:uploadId', documentController.generateForm);

module.exports = router;
