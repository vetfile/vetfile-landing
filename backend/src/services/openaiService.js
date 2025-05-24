// src/services/openaiService.js
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Service for OpenAI interactions
class OpenAIService {
  /**
   * Analyze veteran documents using GPT-4o
   * @param {string} documentText - The extracted text from veteran documents
   * @returns {Promise<object>} - Structured analysis of potential VA claims
   */
  async analyzeVeteranDocuments(documentText) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
messages: [
          {
            role: 'system',
            content: `You are an expert VA disability claims analyst. You must ONLY extract information that is explicitly written in the document provided. DO NOT make assumptions, use placeholder data, or generate fictional information.

CRITICAL INSTRUCTIONS:
- ONLY use information that is clearly visible in the document text
- If information is not present or unclear, mark it as "Not found in document"
- DO NOT use placeholder names like "John Doe" or fake numbers
- Extract EXACT text as written in the document
- Pay special attention to DD Form 214 fields and their actual values

For DD Form 214 documents, extract information from these specific fields:
1. NAME (Last, First, Middle) - Extract the actual name from field 1
2. SSN - Extract from field 3 (if visible)
3. GRADE, RATE OR RANK - Extract from field 4a
4. DATE OF BIRTH - Extract from field 5
5. DATE ENTERED AD THIS PERIOD - Extract from field 12a
6. SEPARATION DATE THIS PERIOD - Extract from field 12b
7. PRIMARY SPECIALTY - Extract from field 11 (MOS and description)
8. DECORATIONS, MEDALS, BADGES - Extract from field 13
9. MILITARY EDUCATION - Extract from field 14
10. MEMBER SIGNATURE and DATE - Extract actual signature info

IMPORTANT: If you cannot find specific information in the document, respond with "Unable to extract from document" rather than making up information.

You will return a structured JSON analysis with the following sections:
1. Veteran information extracted from documents
2. All potential disability claims with supporting evidence
3. Service details that support the claims
4. Recommendations for additional evidence if needed

For each potential claim, include:
- Specific condition name (as recognized by VA)
- Evidence found in the documents
- Confidence level (1-100)
- Relevant CFR references
- Category (physical, mental, etc.)`
          },

          {
            role: 'user',
            content: `Please analyze these veteran documents to identify potential VA disability claims:

DOCUMENT TEXT:
${documentText}

Analyze the documents for:
1. Veteran's personal information (name, service number, branch, dates of service, rank, etc.)
2. Medical conditions documented during service
3. Incidents or injuries during service
4. Exposure to hazardous environments (burn pits, Agent Orange, radiation, etc.)
5. Combat experience and potential for PTSD
6. Occupational hazards based on MOS and assignments
7. All potential presumptive conditions based on service period and locations

For EACH potential disability claim:
- Identify the specific condition
- Extract all supporting evidence from the documents
- Provide VA CFR references when applicable
- Rate confidence level (1-100) based on evidence strength
- Categorize as physical, mental, or environmental
- Note if it could be a primary or secondary condition

Return your analysis in the following JSON format:

{
  "veteranInfo": {
    "name": "string",
    "serviceNumber": "string",
    "branch": "string",
    "serviceStartDate": "YYYY-MM-DD",
    "serviceEndDate": "YYYY-MM-DD",
    "rank": "string",
    "dischargeType": "string"
  },
  "potentialClaims": [
    {
      "condition": "string",
      "description": "string",
      "evidence": ["array of supporting evidence from document"],
      "cfrReference": "string",
      "confidenceScore": 0-100,
      "category": "physical|mental|environmental|other",
      "isPresumed": boolean,
      "isPrimary": boolean
    }
  ],
  "serviceInfo": {
    "deployments": ["array of deployments"],
    "mos": ["array of MOSs/occupations"],
    "combatExperience": boolean,
    "awardsDecorations": ["array of awards"],
    "incidents": ["array of documented incidents"]
  },
  "recommendations": {
    "additionalEvidence": ["array of suggested additional evidence to strengthen claims"],
    "priorityClaims": ["array of conditions with strongest evidence"]
  }
}`
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });

      // Extract and parse response
      const analysisText = response.choices[0].message.content;
      return JSON.parse(analysisText);
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Return error structure
      return {
        error: true,
        message: error.message,
        // Include a fallback analysis to prevent application errors
        fallbackAnalysis: this.generateFallbackAnalysis()
      };
    }
  }

  /**
   * Generate fallback analysis in case of API errors
   * @returns {object} - Basic analysis structure
   */
  generateFallbackAnalysis() {
    return {
      veteranInfo: {
        name: "Unable to extract",
        serviceNumber: "Unable to extract",
        branch: "Unable to extract",
        serviceStartDate: null,
        serviceEndDate: null,
        rank: "Unable to extract",
        dischargeType: "Unable to extract"
      },
      potentialClaims: [
        {
          condition: "Analysis Error",
          description: "There was an error analyzing your documents. This could be due to technical issues or document quality.",
          evidence: ["Error processing document content"],
          cfrReference: null,
          confidenceScore: 0,
          category: "other",
          isPresumed: false,
          isPrimary: true
        }
      ],
      serviceInfo: {
        deployments: [],
        mos: [],
        combatExperience: false,
        awardsDecorations: [],
        incidents: []
      },
      recommendations: {
        additionalEvidence: [
          "Try uploading clearer copies of your documents",
          "Include both your DD214 and medical records if available"
        ],        priorityClaims: []
      }
    };
  }

/**
   * Analyze document using OpenAI Vision API (for scanned PDFs/images)
   * @param {string} base64File - Base64 encoded file data
   * @param {string} mimeType - File MIME type
   * @returns {Promise<string>} - Extracted text content
   */
  async analyzeDocumentWithVision(base64File, mimeType) {
    try {
      console.log('🔍 Using OpenAI Vision API for document analysis');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a document text extraction specialist. Extract ALL text content from the provided document image/PDF. Return ONLY the extracted text content, preserving the original structure and formatting as much as possible. Do not add any commentary or analysis - just return the raw text content.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all text content from this document:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64File}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      });

      const extractedText = response.choices[0].message.content;
      console.log('✅ Vision API extracted', extractedText.length, 'characters');
      
      return extractedText;
    } catch (error) {
      console.error('Vision API error:', error);
      throw new Error(`Vision API failed: ${error.message}`);
    }
  }
/**
   * Process document using OpenAI's file processing (like ChatGPT)
   * @param {string} filePath - Path to the document file
   * @returns {Promise<string>} - Extracted text content
   */
  async processDocumentFile(filePath) {
    try {
      console.log('🔍 Using OpenAI file processing (ChatGPT method)');
      
      const fs = require('fs');
      
      // Step 1: Upload file to OpenAI
      console.log('📤 Uploading file to OpenAI...');
      const file = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants'
      });
      
      console.log(`✅ File uploaded with ID: ${file.id}`);
      
      // Step 2: Create assistant with file access
      const assistant = await this. openai.beta.assistants.create({
        name: "Document Reader",
        instructions: "You are a document reader. Extract ALL text content from uploaded files exactly as written. Return only the extracted text with no additional commentary.",
        model: "gpt-4o",
        tools: [{ type: "file_search" }],
        tool_resources: {
          file_search: {
            vector_store_ids: []
          }
        }
      });
      
      // Step 3: Create vector store and add file
      const vectorStore = await openai.beta.vectorStores.create({
        name: "Document Store"
      });
      
      await openai.beta.vectorStores.files.create(vectorStore.id, {
        file_id: file.id
      });
      
      // Step 4: Update assistant with vector store
      await openai.beta.assistants.update(assistant.id, {
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStore.id]
          }
        }
      });
      
      // Step 5: Create thread and get response
      const thread = await openai.beta.threads.create();
      
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: "Please extract all text content from the uploaded document. Return the complete text exactly as it appears in the document."
      });
      
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id
      });
      
      // Step 6: Wait for completion and get result
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        
        if (runStatus.status === 'failed') {
          throw new Error('Assistant run failed');
        }
      }
      
      const messages = await openai.beta.threads.messages.list(thread.id);
      const extractedText = messages.data[0].content[0].text.value;
      
      // Step 7: Cleanup
      await openai.files.del(file.id);
      await openai.beta.assistants.del(assistant.id);
      await openai.beta.vectorStores.del(vectorStore.id);
      
      console.log(`✅ Extracted ${extractedText.length} characters using file processing`);
      return extractedText;
      
    } catch (error) {
      console.error('File processing error:', error);
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }
}  // This closes the OpenAIService class
module.exports = new OpenAIService();
