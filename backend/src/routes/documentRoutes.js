const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
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

// For now, let's create simple in-memory storage for uploads and analysis
// In production, this would be replaced with a database
const uploads = new Map();
const analyses = new Map();

// Upload documents route
router.post('/upload', upload.array('documents', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded'
      });
    }

    // Generate upload ID
    const uploadId = uuidv4();
    
    // Process and store upload metadata
    const files = req.files.map(file => ({
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      documentType: req.body.documentType || 'unknown',
      uploadedAt: new Date().toISOString()
    }));

    uploads.set(uploadId, {
      id: uploadId,
      files,
      status: 'uploaded',
      uploadedAt: new Date().toISOString()
    });

    res.status(200).json({
      message: 'Files uploaded successfully',
      uploadId,
      files: files.map(f => ({
        id: f.id,
        originalName: f.originalName,
        size: f.size,
        documentType: f.documentType
      }))
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'File upload failed',
      message: error.message
    });
  }
});

// Analyze documents route
router.post('/analyze/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    
    // Check if upload exists
    const upload = uploads.get(uploadId);
    if (!upload) {
      return res.status(404).json({
        error: 'Upload not found'
      });
    }

    // Update status
    upload.status = 'analyzing';
    uploads.set(uploadId, upload);

    // Here we would extract text from documents and analyze with OpenAI
    // For now, let's create a simple mock response
    const useMockAI = process.env.USE_MOCK_AI === 'true';
    
    let analysis;
    if (useMockAI) {
      // Create mock analysis data
      analysis = {
        veteranInfo: {
          name: "John A. Smith",
          serviceNumber: "123-45-6789",
          branch: "U.S. Army",
          serviceStartDate: "2008-06-15",
          serviceEndDate: "2016-08-22",
          rank: "E-5/Sergeant",
          dischargeType: "Honorable"
        },
        potentialClaims: [
          {
            condition: "Post-Traumatic Stress Disorder (PTSD)",
            description: "Combat-related PTSD with symptoms including nightmares, hypervigilance, and anxiety",
            evidence: [
              "Combat deployment to Afghanistan",
              "Combat Infantry Badge indicates combat experience",
              "Medical record mentions anxiety symptoms"
            ],
            cfrReference: "38 CFR 4.130, DC 9411",
            confidenceScore: 85,
            category: "mental",
            isPresumed: false,
            isPrimary: true
          },
          {
            condition: "Tinnitus",
            description: "Ringing in the ears due to combat noise exposure",
            evidence: [
              "Infantry MOS with exposure to weapons fire",
              "Combat deployment with likely noise exposure"
            ],
            cfrReference: "38 CFR 4.87, DC 6260",
            confidenceScore: 80,
            category: "physical",
            isPresumed: false,
            isPrimary: true
          },
          {
            condition: "Lumbar Strain",
            description: "Chronic lower back pain due to carrying heavy equipment",
            evidence: [
              "Infantry MOS requiring carrying heavy loads",
              "Multiple deployments with combat gear"
            ],
            cfrReference: "38 CFR 4.71a, DC 5237",
            confidenceScore: 70,
            category: "physical",
            isPresumed: false,
            isPrimary: true
          }
        ],
        serviceInfo: {
          deployments: [
            "Afghanistan (2012-2013)",
            "Iraq (2009-2010)"
          ],
          mos: [
            "11B Infantry"
          ],
          combatExperience: true,
          awardsDecorations: [
            "Combat Infantry Badge",
            "Army Commendation Medal"
          ],
          incidents: [
            "Engaged in firefight on 2013-03-15"
          ]
        },
        recommendations: {
          additionalEvidence: [
            "Consider obtaining buddy statements from fellow soldiers",
            "Request complete medical records from VA",
            "Schedule VA C&P exam for PTSD"
          ],
          priorityClaims: [
            "Post-Traumatic Stress Disorder (PTSD)",
            "Tinnitus"
          ]
        }
      };
    } else {
      // In the future, we would implement real OpenAI analysis here
      // For now, we'll use the same mock data
      analysis = {
        veteranInfo: {
          name: "John A. Smith",
          serviceNumber: "123-45-6789",
          branch: "U.S. Army",
          serviceStartDate: "2008-06-15",
          serviceEndDate: "2016-08-22",
          rank: "E-5/Sergeant",
          dischargeType: "Honorable"
        },
        potentialClaims: [
          {
            condition: "Post-Traumatic Stress Disorder (PTSD)",
            description: "Combat-related PTSD with symptoms including nightmares, hypervigilance, and anxiety",
            evidence: [
              "Combat deployment to Afghanistan",
              "Combat Infantry Badge indicates combat experience",
              "Medical record mentions anxiety symptoms"
            ],
            cfrReference: "38 CFR 4.130, DC 9411",
            confidenceScore: 85,
            category: "mental",
            isPresumed: false,
            isPrimary: true
          },
          {
            condition: "Tinnitus",
            description: "Ringing in the ears due to combat noise exposure",
            evidence: [
              "Infantry MOS with exposure to weapons fire",
              "Combat deployment with likely noise exposure"
            ],
            cfrReference: "38 CFR 4.87, DC 6260",
            confidenceScore: 80,
            category: "physical",
            isPresumed: false,
            isPrimary: true
          },
          {
            condition: "Lumbar Strain",
            description: "Chronic lower back pain due to carrying heavy equipment",
            evidence: [
              "Infantry MOS requiring carrying heavy loads",
              "Multiple deployments with combat gear"
            ],
            cfrReference: "38 CFR 4.71a, DC 5237",
            confidenceScore: 70,
            category: "physical",
            isPresumed: false,
            isPrimary: true
          }
        ],
        serviceInfo: {
          deployments: [
            "Afghanistan (2012-2013)",
            "Iraq (2009-2010)"
          ],
          mos: [
            "11B Infantry"
          ],
          combatExperience: true,
          awardsDecorations: [
            "Combat Infantry Badge",
            "Army Commendation Medal"
          ],
          incidents: [
            "Engaged in firefight on 2013-03-15"
          ]
        },
        recommendations: {
          additionalEvidence: [
            "Consider obtaining buddy statements from fellow soldiers",
            "Request complete medical records from VA",
            "Schedule VA C&P exam for PTSD"
          ],
          priorityClaims: [
            "Post-Traumatic Stress Disorder (PTSD)",
            "Tinnitus"
          ]
        }
      };
    }

    // Store analysis results
    const analysisId = uuidv4();
    const analysisResult = {
      id: analysisId,
      uploadId,
      analysis,
      createdAt: new Date().toISOString()
    };

    analyses.set(analysisId, analysisResult);

    // Update upload record
    upload.status = 'analyzed';
    upload.analysisId = analysisId;
    upload.analyzedAt = new Date().toISOString();
    uploads.set(uploadId, upload);

    // Return results
    res.status(200).json({
      message: 'Documents analyzed successfully',
      uploadId,
      analysisId,
      analysis
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

// Get analysis results
router.get('/analysis/:uploadId', (req, res) => {
  try {
    const { uploadId } = req.params;
    
    // Check if upload exists
    const upload = uploads.get(uploadId);
    if (!upload) {
      return res.status(404).json({
        error: 'Upload not found'
      });
    }

    // If analysis hasn't been performed yet
    if (!upload.analysisId) {
      return res.status(400).json({
        error: 'Analysis not yet performed for this upload',
        status: upload.status
      });
    }

    // Get analysis
    const analysis = analyses.get(upload.analysisId);
    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found'
      });
    }

    res.status(200).json({
      uploadId,
      analysisId: upload.analysisId,
      status: upload.status,
      analysis: analysis.analysis,
      createdAt: analysis.createdAt
    });
    
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis',
      message: error.message
    });
  }
});

// Generate VA form
router.post('/generate-form/:uploadId', (req, res) => {
  try {
    const { uploadId } = req.params;
    const { selectedClaims } = req.body;
    
    if (!selectedClaims || !Array.isArray(selectedClaims) || selectedClaims.length === 0) {
      return res.status(400).json({
        error: 'No claims selected'
      });
    }

    // Check if upload exists
    const upload = uploads.get(uploadId);
    if (!upload || !upload.analysisId) {
      return res.status(404).json({
        error: 'Upload or analysis not found'
      });
    }

    // Get analysis
    const analysis = analyses.get(upload.analysisId);
    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found'
      });
    }

    // Generate form data
    const { veteranInfo, potentialClaims, serviceInfo } = analysis.analysis;
    
    // Filter claims to only those selected by the user
    const selectedClaimData = potentialClaims.filter(claim => 
      selectedClaims.includes(claim.condition)
    );

    // Structure the form data
    const formData = {
      // Form metadata
      formId: uuidv4(),
      formType: 'VA-21-526EZ',
      generatedDate: new Date().toISOString(),
      
      // Veteran information
      veteran: {
        name: veteranInfo.name || '',
        serviceNumber: veteranInfo.serviceNumber || '',
        ssn: '', // Would need to be provided by the user
        dob: '', // Would need to be provided by the user
        branch: veteranInfo.branch || '',
        serviceStartDate: veteranInfo.serviceStartDate || '',
        serviceEndDate: veteranInfo.serviceEndDate || '',
        rank: veteranInfo.rank || '',
        dischargeType: veteranInfo.dischargeType || '',
        
        // Contact info (would be provided by user in production)
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        phone: '',
        email: ''
      },
      
      // Disability claims
      disabilities: selectedClaimData.map((claim, index) => ({
        id: uuidv4(),
        sequence: index + 1,
        condition: claim.condition,
        description: claim.description || '',
        evidence: claim.evidence || [],
        cfrReference: claim.cfrReference || '',
        confidenceScore: claim.confidenceScore || 0,
        category: claim.category || 'other',
        isPrimary: claim.isPrimary || true,
        isPresumed: claim.isPresumed || false,
        dateOfOnset: '', // Would need to be provided by user
        relatedMilitaryService: true
      })),
      
      // Service information
      serviceDetails: {
        deployments: serviceInfo?.deployments || [],
        mos: serviceInfo?.mos || [],
        combatExperience: serviceInfo?.combatExperience || false,
        awardsDecorations: serviceInfo?.awardsDecorations || [],
        incidents: serviceInfo?.incidents || []
      }
    };

    res.status(200).json({
      message: 'Form generated successfully',
      form: {
        formData
      }
    });
    
  } catch (error) {
    console.error('Form generation error:', error);
    res.status(500).json({
      error: 'Form generation failed',
      message: error.message
    });
  }
});

module.exports = router;
