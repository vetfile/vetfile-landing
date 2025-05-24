const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const openaiService = require('../services/openaiService');
const documentProcessingService = require('../services/documentProcessingService');

// In-memory storage for MVP (replace with database in production)
const uploads = new Map();
const analyses = new Map();

/**
 * Handle document uploads
 */
exports.uploadDocuments = async (req, res) => {
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
};

/**
 * Analyze uploaded documents
 */
exports.analyzeDocuments = async (req, res) => {
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

    // Process the documents to extract text
    const combinedText = await documentProcessingService.processDocuments(upload.files);
    
    // Log the combined text length for debugging
    console.log(`Extracted ${combinedText.length} characters from ${upload.files.length} documents`);

    // Send to OpenAI for analysis
    let analysis;
    
    // Check if we should use mock data or real AI
    const useMockAI = process.env.USE_MOCK_AI === 'true';
    console.log('USE_MOCK_AI env var:', process.env.USE_MOCK_AI);
    console.log('Using mock AI?', useMockAI); 
    if (useMockAI) {
      console.log('Using mock analysis data');
      analysis = getMockAnalysis();
    } else {
      console.log('Using OpenAI for analysis');
      analysis = await openaiService.analyzeVeteranDocuments(combinedText);
      
      // Check if there was an error with OpenAI
      if (analysis.error) {
        console.error('OpenAI analysis error:', analysis.message);
        analysis = analysis.fallbackAnalysis;
      }
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
    
    // Update status to failed
    const upload = uploads.get(req.params.uploadId);
    if (upload) {
      upload.status = 'failed';
      upload.error = error.message;
      uploads.set(req.params.uploadId, upload);
    }
    
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
};

/**
 * Get analysis results
 */
exports.getAnalysis = async (req, res) => {
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
};

/**
 * Generate VA form
 */
exports.generateForm = async (req, res) => {
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
      formId: uuidv4(),
      formType: 'VA-21-526EZ',
      generatedDate: new Date().toISOString(),
      
      veteran: {
        name: veteranInfo.name || '',
        serviceNumber: veteranInfo.serviceNumber || '',
        ssn: '',
        dob: '',
        branch: veteranInfo.branch || '',
        serviceStartDate: veteranInfo.serviceStartDate || '',
        serviceEndDate: veteranInfo.serviceEndDate || '',
        rank: veteranInfo.rank || '',
        dischargeType: veteranInfo.dischargeType || '',
        
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        phone: '',
        email: ''
      },
      
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
        dateOfOnset: '',
        relatedMilitaryService: true
      })),
      
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
};

/**
 * Get mock analysis data (for testing and fallback)
 */
function getMockAnalysis() {
  return {
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

exports.processPDF = async (req, res) => {
  try {
    console.log('🔍 Starting smart PDF processing');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    const filePath = req.file.path;
    console.log('🔍 Processing file:', filePath);

    let extractedText = '';
    let processingMethod = '';
    
    try {
  const textResult = await documentProcessingService.extractText(filePath, req.file.mimetype);
  extractedText = textResult.trim();
      
      console.log('🔍 Text extraction result length:', extractedText.length);
      console.log('🔍 Sample text (first 100 chars):', extractedText.substring(0, 100));
      
      const isTextUsable = extractedText.length > 200 && 
                          extractedText.includes('CERTIFICATE') && 
                          (extractedText.includes('DD') || extractedText.includes('214'));
      
      if (isTextUsable) {
        console.log('✅ Using text-based processing');
        processingMethod = 'text-extraction';
      } else {
        console.log('🔍 Text extraction insufficient, switching to Vision API');
        processingMethod = 'vision-api';
        
        const pdfPoppler = require('pdf-poppler');
        const fs = require('fs');
        
        try {
          console.log('🔍 Converting PDF to image...');
          const options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'page',
            page: 1
          };
          
          const imagePath = await pdfPoppler.convert(filePath, options);
          console.log('🔍 PDF converted to image:', imagePath);
          
          // Read the converted image
          const imageBuffer = fs.readFileSync(imagePath[0]);
          const base64Image = imageBuffer.toString('base64');
          
          console.log('🔍 Sending image to Vision API...');
          extractedText = await openaiService.analyzeDocumentWithVision(base64Image, 'image/png');
          
          // Clean up temporary image
          fs.unlinkSync(imagePath[0]);
          
        } catch (visionError) {
          console.error('Vision API processing failed:', visionError);
          extractedText = 'Error: Could not process PDF with Vision API';
        }
      }
    } catch (error) 
      console.error('PDF processing error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process PDF',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      processingMethod: processingMethod,
      extractedTextLength: extractedText.length,
      extractedText: extractedText.substring(0, 500),
      message: `Successfully processed PDF using ${processingMethod}`
    });

  } catch (error) {
    console.error('Smart PDF processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process PDF',
      error: error.message
    });
  }
};
