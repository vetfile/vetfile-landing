import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight,
  Download,
  Loader
} from 'lucide-react';

// Main Application Component
const VetFileApp = () => {
  // State variables
  const [files, setFiles] = useState([]);
  const [uploadId, setUploadId] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [selectedClaims, setSelectedClaims] = useState([]);
  const [generatedForm, setGeneratedForm] = useState(null);

  // API URL from environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Handle file upload
  const onDrop = useCallback(acceptedFiles => {
    setFiles(prev => [...prev, ...acceptedFiles.map(file => ({
      file,
      id: `file-${Date.now()}-${file.name}`,
      name: file.name,
      type: file.type,
      documentType: getDocumentType(file.name)
    }))]);
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 20 * 1024 * 1024 // 20MB
  });

  // Guess document type from filename
  const getDocumentType = (filename) => {
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.includes('dd214') || lowerFilename.includes('discharge')) {
      return 'DD214';
    } else if (lowerFilename.includes('med') || lowerFilename.includes('health') || lowerFilename.includes('treatment')) {
      return 'Medical Record';
    } else if (lowerFilename.includes('service') || lowerFilename.includes('personnel')) {
      return 'Service Record';
    }
    return 'Unknown';
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setFiles(files.filter(file => file.id !== fileId));
  };

  // Update document type
  const updateDocumentType = (fileId, type) => {
    setFiles(files.map(file => 
      file.id === fileId ? { ...file, documentType: type } : file
    ));
  };

  // Upload files to server
  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please add at least one document to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Append each file to the form data
      files.forEach(fileObj => {
        formData.append('documents', fileObj.file);
        formData.append('documentTypes', fileObj.documentType);
      });

      // Upload files
      const response = await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Store upload ID
      setUploadId(response.data.uploadId);
      
      // Move to next step
      setCurrentStep(2);
      
      // Automatically start analysis
      await analyzeDocuments(response.data.uploadId);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  // Analyze uploaded documents
  const analyzeDocuments = async (id) => {
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/documents/analyze/${id}`);
      
      setAnalysisId(response.data.analysisId);
      setAnalysis(response.data.analysis);
      
      // Move to review step
      setCurrentStep(3);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.response?.data?.error || 'Failed to analyze documents');
    } finally {
      setLoading(false);
    }
  };

  // Toggle claim selection
  const toggleClaimSelection = (condition) => {
    setSelectedClaims(prev => 
      prev.includes(condition)
        ? prev.filter(claim => claim !== condition)
        : [...prev, condition]
    );
  };

  // Generate VA form
  const generateForm = async () => {
    if (selectedClaims.length === 0) {
      setError('Please select at least one claim to include in your form');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/documents/generate-form/${uploadId}`, {
        selectedClaims
      });
      
      setGeneratedForm(response.data.form);
      setCurrentStep(4);
      
    } catch (error) {
      console.error('Form generation error:', error);
      setError(error.response?.data?.error || 'Failed to generate VA form');
    } finally {
      setLoading(false);
    }
  };

  // Reset application
  const resetApp = () => {
    setFiles([]);
    setUploadId(null);
    setAnalysisId(null);
    setAnalysis(null);
    setSelectedClaims([]);
    setGeneratedForm(null);
    setCurrentStep(1);
    setError(null);
  };

  // Render steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <UploadStep 
          files={files} 
          getRootProps={getRootProps} 
          getInputProps={getInputProps} 
          isDragActive={isDragActive}
          removeFile={removeFile}
          updateDocumentType={updateDocumentType}
          uploadFiles={uploadFiles}
          loading={loading}
        />;
      case 2:
        return <AnalysisStep loading={loading} />;
      case 3:
        return <ReviewClaimsStep 
          analysis={analysis}
          selectedClaims={selectedClaims}
          toggleClaimSelection={toggleClaimSelection}
          generateForm={generateForm}
          loading={loading}
        />;
      case 4:
        return <FormGeneratedStep 
          form={generatedForm}
          resetApp={resetApp}
        />;
      default:
        return <UploadStep />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Progress Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                currentStep === step 
                  ? 'border-blue-600 bg-blue-600 text-white' 
                  : currentStep > step 
                    ? 'border-blue-600 bg-blue-100 text-blue-600' 
                    : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < 4 && (
                <div className={`w-10 h-0.5 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <div className="grid grid-cols-4 gap-4 text-sm text-center">
            <div className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Upload</div>
            <div className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Analyze</div>
            <div className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Review</div>
            <div className={currentStep >= 4 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Generate</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Current Step Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {renderStep()}
      </div>
    </div>
  );
};

// Step 1: Upload Documents
const UploadStep = ({ files, getRootProps, getInputProps, isDragActive, removeFile, updateDocumentType, uploadFiles, loading }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Your Military Documents</h2>
    
    <p className="text-gray-600 mb-6">
      Upload your DD214, medical records, and other service documents. We'll analyze these to identify potential VA disability claims.
    </p>
    
    {/* Dropzone */}
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="text-lg text-gray-700 mb-2">
        {isDragActive ? "Drop the files here..." : "Drag & drop files here, or click to select"}
      </p>
      <p className="text-sm text-gray-500">
        Accepts PDF, JPG, and PNG (max 20MB per file)
      </p>
    </div>
    
    {/* File List */}
    {files && files.length > 0 && (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Uploaded Documents</h3>
        
        <div className="space-y-3">
          {files.map(fileObj => (
            <div key={fileObj.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-gray-800 font-medium">{fileObj.name}</p>
                  <p className="text-sm text-gray-500">
                    {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <select 
                  className="mr-4 border border-gray-300 rounded-md px-2 py-1 text-sm"
                  value={fileObj.documentType}
                  onChange={(e) => updateDocumentType(fileObj.id, e.target.value)}
                >
                  <option value="DD214">DD214</option>
                  <option value="Medical Record">Medical Record</option>
                  <option value="Service Record">Service Record</option>
                  <option value="Other">Other</option>
                </select>
                
                <button 
                  onClick={() => removeFile(fileObj.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Upload Button */}
    <div className="mt-8 flex justify-center">
      <button
        onClick={uploadFiles}
        disabled={loading || !files || files.length === 0}
        className={`px-6 py-3 rounded-md flex items-center ${
          loading || !files || files.length === 0
            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            Analyze Documents
            <ChevronRight className="w-5 h-5 ml-2" />
          </>
        )}
      </button>
    </div>
  </div>
);

// Step 2: Analyzing Documents
const AnalysisStep = ({ loading }) => (
  <div className="text-center py-8">
    <div className="flex justify-center mb-6">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
    
    <h2 className="text-2xl font-bold text-gray-800 mb-4">Analyzing Your Documents</h2>
    
    <p className="text-gray-600 max-w-xl mx-auto mb-6">
      Our AI is reviewing your military records to identify potential VA disability claims based on your service history, medical conditions, and documented incidents.
    </p>
    
    <div className="max-w-md mx-auto bg-blue-50 rounded-lg p-4 text-blue-800 text-sm">
      This process typically takes 30-60 seconds depending on the number and complexity of your documents.
    </div>
  </div>
);

// Step 3: Review Claims
const ReviewClaimsStep = ({ analysis, selectedClaims, toggleClaimSelection, generateForm, loading }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Potential Claims</h2>
    
    {/* Veteran Information Section */}
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Veteran Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">Name</p>
          <p className="font-medium">{analysis.veteranInfo.name || 'Not found'}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Service Number</p>
          <p className="font-medium">{analysis.veteranInfo.serviceNumber || 'Not found'}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Branch</p>
          <p className="font-medium">{analysis.veteranInfo.branch || 'Not found'}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Rank</p>
          <p className="font-medium">{analysis.veteranInfo.rank || 'Not found'}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Service Period</p>
          <p className="font-medium">
            {analysis.veteranInfo.serviceStartDate || 'Unknown'} - {analysis.veteranInfo.serviceEndDate || 'Unknown'}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Discharge Type</p>
          <p className="font-medium">{analysis.veteranInfo.dischargeType || 'Not found'}</p>
        </div>
      </div>
    </div>
    
    {/* Service Info Section */}
    {analysis.serviceInfo && (
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Service Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.serviceInfo.deployments && analysis.serviceInfo.deployments.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Deployments</p>
              <ul className="list-disc list-inside">
                {analysis.serviceInfo.deployments.map((deployment, index) => (
                  <li key={index} className="text-gray-700">{deployment}</li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.serviceInfo.mos && analysis.serviceInfo.mos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">MOS / Specialty</p>
              <ul className="list-disc list-inside">
                {analysis.serviceInfo.mos.map((mos, index) => (
                  <li key={index} className="text-gray-700">{mos}</li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.serviceInfo.awardsDecorations && analysis.serviceInfo.awardsDecorations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Awards & Decorations</p>
              <ul className="list-disc list-inside">
                {analysis.serviceInfo.awardsDecorations.map((award, index) => (
                  <li key={index} className="text-gray-700">{award}</li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.serviceInfo.incidents && analysis.serviceInfo.incidents.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Documented Incidents</p>
              <ul className="list-disc list-inside">
                {analysis.serviceInfo.incidents.map((incident, index) => (
                  <li key={index} className="text-gray-700">{incident}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )}
    
    {/* Potential Claims Section */}
    <h3 className="text-xl font-semibold text-gray-800 mb-4">Potential Claims Identified</h3>
    
    {analysis.potentialClaims && analysis.potentialClaims.length > 0 ? (
      <div className="space-y-4 mb-6">
        {analysis.potentialClaims.map((claim, index) => (
          <div 
            key={index} 
            className={`border rounded-lg p-4 transition-colors ${
              selectedClaims.includes(claim.condition) 
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start">
              <input
                type="checkbox"
                id={`claim-${index}`}
                checked={selectedClaims.includes(claim.condition)}
                onChange={() => toggleClaimSelection(claim.condition)}
                className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <label htmlFor={`claim-${index}`} className="text-lg font-medium text-gray-900 cursor-pointer">
                    {claim.condition}
                  </label>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    claim.confidenceScore >= 80 
                      ? 'bg-green-100 text-green-800' 
                      : claim.confidenceScore >= 50 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {claim.confidenceScore}% Confidence
                  </div>
                </div>
                
                <p className="text-gray-600 mt-1">{claim.description}</p>
                
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-500">Supporting Evidence:</p>
                  <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                    {claim.evidence.map((evidence, idx) => (
                      <li key={idx} className="ml-2">{evidence}</li>
                    ))}
                  </ul>
                </div>
                
                {claim.cfrReference && (
                  <div className="mt-2 text-sm text-gray-500">
                    <span className="font-medium">CFR Reference:</span> {claim.cfrReference}
                  </div>
                )}
                
                <div className="mt-2 flex items-center">
                  <span className="text-xs font-medium mr-2 px-2.5 py-0.5 rounded bg-gray-100 text-gray-800">
                    {claim.category}
                  </span>
                  
                  {claim.isPresumed && (
                    <span className="text-xs font-medium mr-2 px-2.5 py-0.5 rounded bg-green-100 text-green-800">
                      Presumptive
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800">
          No potential claims were identified in your documents. This could be due to limited information in the uploaded files. 
          Consider uploading additional service records or medical documentation.
        </p>
      </div>
    )}
    
    {/* Additional Recommendations */}
    {analysis.recommendations && (
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Recommendations</h3>
        
        {analysis.recommendations.additionalEvidence && analysis.recommendations.additionalEvidence.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-blue-800 mb-1">Additional Evidence to Consider:</p>
            <ul className="list-disc list-inside text-blue-700">
              {analysis.recommendations.additionalEvidence.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.recommendations.priorityClaims && analysis.recommendations.priorityClaims.length > 0 && (
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Priority Claims (Strongest Evidence):</p>
            <ul className="list-disc list-inside text-blue-700">
              {analysis.recommendations.priorityClaims.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
    
    {/* Generate Form Button */}
    <div className="mt-8 flex justify-center">
      <button
        onClick={generateForm}
        disabled={loading || selectedClaims.length === 0}
        className={`px-6 py-3 rounded-md flex items-center ${
          loading || selectedClaims.length === 0
            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 mr-2 animate-spin" />
            Generating Form...
          </>
        ) : (
          <>
            Generate VA Form
            <ChevronRight className="w-5 h-5 ml-2" />
          </>
        )}
      </button>
    </div>
    
    {selectedClaims.length === 0 && (
      <p className="mt-3 text-center text-sm text-gray-500">
        Select at least one claim to generate your VA form
      </p>
    )}
  </div>
);

// Step 4: Form Generated
const FormGeneratedStep = ({ form, resetApp }) => (
  <div className="text-center">
    <div className="flex justify-center mb-6">
      <CheckCircle className="w-16 h-16 text-green-500" />
    </div>
    
    <h2 className="text-2xl font-bold text-gray-800 mb-4">VA Form Generated!</h2>
    
    <p className="text-gray-600 max-w-xl mx-auto mb-8">
      Your VA Form 21-526EZ has been generated with {form.formData.disabilities.length} selected disability claims.
      You can download the form and submit it to the VA.
    </p>
    
    <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-2xl mx-auto text-left">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Form Summary</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500">Veteran Name</p>
        <p className="font-medium">{form.formData.veteran.name}</p>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500">Selected Claims</p>
        <ul className="list-disc list-inside">
          {form.formData.disabilities.map((disability, index) => (
            <li key={index} className="font-medium">{disability.condition}</li>
          ))}
        </ul>
      </div>
      
      <div>
        <p className="text-sm text-gray-500">Generated On</p>
        <p className="font-medium">{new Date(form.formData.generatedDate).toLocaleString()}</p>
      </div>
    </div>
    
    <div className="space-x-4">
      <button
        className="px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center inline-flex"
      >
        <Download className="w-5 h-5 mr-2" />
        Download Form
      </button>
      
      <button
        onClick={resetApp}
        className="px-6 py-3 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex"
      >
        Process Another Document
      </button>
    </div>
    
    <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
      <p className="text-sm text-blue-800">
        <strong>Next Steps:</strong> Print this form and submit it to your local VA office or file online at va.gov/disability/how-to-file-claim
      </p>
    </div>
  </div>
);

export default VetFileApp;
