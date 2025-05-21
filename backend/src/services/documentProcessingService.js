// src/services/documentProcessingService.js
const fs = require('fs').promises;
const pdf = require('pdf-parse');
const path = require('path');

// Service for document processing and text extraction
class DocumentProcessingService {
  /**
   * Extract text from a document file
   * @param {string} filePath - Path to the document file
   * @param {string} mimetype - MIME type of the file
   * @returns {Promise<string>} - Extracted text
   */
  async extractText(filePath, mimetype) {
    try {
      if (mimetype === 'application/pdf') {
        return await this.extractFromPDF(filePath);
      } else if (mimetype.startsWith('image/')) {
        // For MVP, just note that it's an image
        // In production, you would integrate OCR like Tesseract or Google Vision
        return await this.handleImageFile(filePath, mimetype);
      } else {
        throw new Error(`Unsupported file type: ${mimetype}`);
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      return `Error extracting text: ${error.message}`;
    }
  }

  /**
   * Extract text from a PDF file
   * @param {string} filePath - Path to the PDF file
   * @returns {Promise<string>} - Extracted text
   */
  async extractFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return data.text || 'No text content found in PDF';
    } catch (error) {
      console.error('PDF extraction error:', error);
      return `Error extracting PDF text: ${error.message}`;
    }
  }

  /**
   * Handle image file (placeholder for OCR integration)
   * @param {string} filePath - Path to the image file
   * @param {string} mimetype - MIME type of the image
   * @returns {Promise<string>} - Text description of the image
   */
  async handleImageFile(filePath, mimetype) {
    // This is a placeholder for OCR integration
    // In a production app, you'd integrate with a service like Google Vision,
    // Amazon Textract, or Tesseract.js
    
    const filename = path.basename(filePath);
    
    return `[IMAGE FILE - OCR PROCESSING REQUIRED]
    
File: ${filename}
Type: ${mimetype}

To properly analyze image files, please consider:
1. Converting to PDF if this is a document
2. Ensuring the text is clearly visible
3. Uploading additional text-based documents if available`;
  }

  /**
   * Process multiple documents and combine their text
   * @param {Array} files - Array of file objects with paths and mimetypes
   * @returns {Promise<string>} - Combined text from all documents
   */
  async processDocuments(files) {
    const textPromises = files.map(async file => {
      const extractedText = await this.extractText(file.path, file.mimetype);
      return `--- DOCUMENT: ${file.originalName} (${file.documentType}) ---\n${extractedText}`;
    });
    
    const textResults = await Promise.all(textPromises);
    return textResults.join('\n\n');
  }
}

module.exports = new DocumentProcessingService();
