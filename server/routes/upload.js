const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const authMiddleware = require('../utils/authMiddleware');
const Report = require('../models/Report');
const { extractHealthParameters } = require('../utils/parameterExtractor');

//const pdfjsLib=require('pdfjs-dist');
const router = express.Router();

// extra helper to clean and structure OCR text
function parseHealthParameters(text){
  const lines=text.split('\n').map(l=>l.trim()).filter(Boolean);
  const parameters=[];
  lines.forEach(line=>{
    //match patterns 
    const match=line.match(/([A-Za-z ]+)[\:\-\=]\s*(\d+\.?\d*)\s*([A-Za-z\/%]*)?/);
    if(match){
      parameters.push({
        name:match[1].trim(),
        value:match[2],
        unit:match[3],
        normalRange:'N/A',
        status:'UNKNOWN',
        category:'General'
      });
    }
  });
  return parameters;
}

// Configure multer for in-memory file uploads (no disk storage)
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory instead of disk
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

// Upload and process file endpoint
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer; // File is now in memory as buffer
    let extractedText = '';
    
    try {
      // Extract text based on file type
      if (req.file.mimetype === 'application/pdf') {
        extractedText = await extractTextFromPDFBuffer(fileBuffer);
      } else {
        extractedText = await extractTextFromImageBuffer(fileBuffer);
      }

      // Allow processing with minimal or no text, but warn the user
      const hasMinimalText = extractedText && extractedText.trim().length > 0 && extractedText.trim().length < 50;
      const hasNoText = !extractedText || extractedText.trim().length === 0;
      
      let isScannedDocument = false;
      
      if (hasNoText) {
        console.log('No text extracted from file');      // For scanned documents with no text, offer manual entry instead of blocking
      isScannedDocument = true;
      extractedText = ' '; // Use a space character to avoid validation errors
      } else if (hasMinimalText) {
        console.log('Minimal text extracted, likely a scanned document');
        isScannedDocument = true;
      }

      console.log('Extracted text length:', extractedText.length);
      if (extractedText.length > 0) {
        console.log('First 500 characters:', extractedText.substring(0, 500));
      }

      // Extract health parameters from the text
      const healthParameters = extractedText.length > 0 ? extractHealthParameters(extractedText) : [];

      //fallback parser if nothing found
      if(healthParameters.length===0){
        const parsedParams=parseHealthParameters(extractedText);
        if(parsedParams.length>0){
          console.log('Fallback parser extracted parameters:',parsedParams);
          healthParameters.push(...parsedParams);
        }
      }
      console.log('Extracted parameters:', healthParameters);

      
      // If no parameters found and it's not a scanned document, reject
      if ((!healthParameters || healthParameters.length === 0) && !isScannedDocument) {
        console.log('No health parameters found in extracted text');
        return res.status(400).json({ 
          error: 'No health parameters found in the document. Please ensure this is a valid lab report.' 
        });
      }
      
      // For scanned documents with no parameters, we'll store it anyway but mark it
      const isEmptyReport = healthParameters.length === 0;

      // Save report to database (without file path since we don't store files)
      const report = new Report({
        userId: req.user.id,
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        extractedText: extractedText,
        healthParameters: healthParameters,
        isScannedDocument: isScannedDocument,
        requiresManualEntry: isEmptyReport,
        createdAt: new Date()
      });

      const savedReport = await report.save();

      // Send appropriate response based on document type
      if (isScannedDocument) {
        res.json({
          success: true,
          reportId: savedReport._id,
          filename: req.file.originalname,
          isScannedDocument: true,
          healthParameters: healthParameters,
          extractedParameterCount: healthParameters.length,
          requiresManualEntry: isEmptyReport,
          message: isEmptyReport ? 
            "This appears to be a scanned document. No health parameters were automatically detected. You may need to enter data manually." : 
            "This appears to be a scanned document. Some health parameters were detected, but you may need to verify and complete the data."
        });
      } else {
        res.json({
          success: true,
          reportId: savedReport._id,
          filename: req.file.originalname,
          healthParameters: healthParameters,
          extractedParameterCount: healthParameters.length
        });
      }

    } catch (extractionError) {
      console.error('File processing error:', extractionError);
      
      // Instead of throwing the error, handle it gracefully
      // by setting empty text and marking as requiring manual entry
      extractedText = ' '; // Use a space to avoid empty string validation errors
      isScannedDocument = true;
      isEmptyReport = true;
      
      // Continue with report creation despite extraction failure
      const report = new Report({
        userId: req.user.id,
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        extractedText: extractedText,
        healthParameters: [],
        isScannedDocument: true,
        requiresManualEntry: true,
        processingStatus: 'manual_entry_needed',
        createdAt: new Date()
      });
      
      try {
        const savedReport = await report.save();
        
        return res.json({
          success: true,
          reportId: savedReport._id,
          filename: req.file.originalname,
          isScannedDocument: true,
          healthParameters: [],
          extractedParameterCount: 0,
          requiresManualEntry: true,
          message: "We couldn't process this document automatically. You'll need to enter the data manually."
        });
      } catch (saveError) {
        console.error('Failed to save report after extraction error:', saveError);
        return res.status(500).json({ 
          error: 'Failed to process and save the report. Please try again.' 
        });
      }
    }

  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process uploaded file' 
    });
  }
});

// Helper function to extract text from PDF buffer
async function extractTextFromPDFBuffer(buffer) {
  try {
    const data = await pdfParse(buffer);
    console.log('PDF text extraction successful, length:', data.text.length);
    
    // If PDF has almost no text, it's probably a scanned document
    if (data.text.trim().length < 10) {
      console.log('PDF appears to be scanned/image-based with minimal text content.');
      console.log('Attempting to use OCR on the PDF...');
      
      try {
        // Skip PDFDocument loading to save memory - go straight to OCR
        console.log('Attempting image-based OCR for scanned PDF');
        
        try {
          // Process directly without additional PDF parsing
          const ocrText = await extractTextFromImageBuffer(buffer);
          if (ocrText && ocrText.trim().length > 0) {
            return ocrText;
          } else {
            // If OCR didn't find anything, return a space to avoid validation errors
            return ' ';
          }
        } catch (innerOcrError) {
          console.error('PDF OCR extraction failed:', innerOcrError);
          return ' '; // Return space to avoid validation errors
        }
      } catch (ocrError) {
        console.error('PDF OCR fallback failed:', ocrError);
        return ' '; // Return space to avoid validation errors
      }
    }
    
    // Return the text, ensuring it's not empty
    return data.text || ' ';
  } catch (error) {
    console.error('PDF extraction error:', error);
    // Return a space instead of throwing an error
    return ' ';
  }
}

// Helper function to extract text from image buffer using Tesseract OCR
async function extractTextFromImageBuffer(buffer) {
  try {
    console.log('Starting OCR processing...');
    
    const processedBuffer=await sharp(buffer)
    .resize({width:2500,height:2500,fit:'inside',withoutEnlargement:true})
    .grayscale()
    .normalize()
    .sharpen()
    .threshold(120)
    .toBuffer();
    let bestText='';
    let bestScore=0;
    const {data:{text,confidence}}=await Tesseract.recognize(processedBuffer,'eng',{
      logger:m=>{
        if(m.status==='recognizing text' && m.progress===0){
          console.log('OCR started with enhanced preprocessing...');
        }
      }
    });
    //simple scoring
    const charCount=text.length;
    const medicalTerms=(text.match(/(glucose|cholesterol|hemoglobin|mg\/dl|mmol\/l)/gi)||[]).length;
    const score=(charCount*0.1)+(confidence*0.3)+(medicalTerms*5);
    if(score>bestScore){
      bestScore=score;
      bestText=text;
    }
    

    // Get image metadata for better processing decisions
    const metadata = await sharp(buffer).metadata();
    
    // Determine optimal processing based on image size
    // For large images, we'll use more aggressive downsampling
    const isLargeImage = metadata.width > 2000 || metadata.height > 2000;
    const maxDimension = isLargeImage ? 2000 : Math.max(metadata.width, metadata.height);
    
    // Use fewer preprocessing methods to save time and memory
    const preprocessingMethods = [
      // Method 1: Optimized for medical documents with tables
      {
        name: 'Medical Document',
        process: () => sharp(buffer)
          .resize({ 
            width: maxDimension, 
            height: maxDimension, 
            fit: 'inside',
            withoutEnlargement: false
          })
          .grayscale()
          .normalize() // Auto-adjust contrast
          .linear(1.3, -35) // Enhance contrast specifically for text
          .threshold(128) // Clean binary threshold
          .png({ compressionLevel: 6 }) // Use compression to save memory
          .toBuffer()
      },
      // Method 2: Table structure preservation
      {
        name: 'Table Preserving',
        process: () => sharp(buffer)
          .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: false })
          .grayscale()
          .sharpen()
          .normalize()
          .modulate({ brightness: 1.15 })
          .linear(1.4, -40) // Strong contrast
          .png({ compressionLevel: 6 })
          .toBuffer()
      },
      // Method 3: Adaptive enhancement for poor quality scans
      {
        name: 'Adaptive Enhancement',
        process: () => sharp(buffer)
          .resize({ width: 3000, height: 3000, fit: 'inside' })
          .grayscale()
          .clahe({ width: 64, height: 64, maxSlope: 3 }) // Local contrast enhancement
          .gamma(1.2)
          .sharpen({ sigma: 1, m1: 0.5, m2: 2, x1: 2, y2: 10, y3: 20 })
          .threshold(110) // Slightly more aggressive threshold
          .negate() // Try inverted
          .negate() // And back to normal
          .png()
          .toBuffer()
      },
      // Method 4: Conservative approach for already clean images
      {
        name: 'Conservative Clean',
        process: () => sharp(buffer)
          .resize({ width: 2500, height: 2500, fit: 'inside', withoutEnlargement: true })
          .grayscale()
          .normalize()
          .sharpen()
          .png({ quality: 95 })
          .toBuffer()
      }
    ];

    let bestResult = { text: '', confidence: 0, method: '', processedCount: 0 };
    let allResults = [];

    // Try each preprocessing method with optimized OCR configuration
    for (const method of preprocessingMethods) {
      try {
        console.log(`Processing with method: ${method.name}`);
        const processedBuffer = await method.process();

        // Use a single optimized OCR config instead of multiple passes
        const ocrConfigs = [
          // Single optimized config for medical/lab reports
          {
            name: 'Optimized',
            options: {
              tessedit_pageseg_mode: Tesseract.PSM.AUTO,
              tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
              tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,()-/:% <>',
              preserve_interword_spaces: '1',
              tessedit_write_images: '0'
            }
          }
        ];

        for (const config of ocrConfigs) {
          try {
            const { data: { text, confidence } } = await Tesseract.recognize(processedBuffer, 'eng', {
              logger: m => {
                if (m.status === 'recognizing text') {
                  // Only log start and completion to reduce console output
                  if (m.progress === 0) {
                    console.log(`OCR started for ${method.name}`);
                  } else if (m.progress >= 0.99) {
                    console.log(`OCR completed for ${method.name}`);
                  }
                }
              },
              ...config.options
            });

            bestResult.processedCount++;
            
            // Enhanced quality scoring
            const charCount = text.length;
            const wordCount = text.split(/\s+/).length;
            const numberCount = (text.match(/\d/g) || []).length;
            const medicalTermCount = (text.match(/(?:cholesterol|glucose|hemoglobin|blood|count|triglyceride|creatinine|bilirubin|protein|albumin|globulin|ratio|urea|sodium|potassium|chloride|test|result|value|reference|range|normal|high|low|mg|dl|mmol|gm)/gi) || []).length;
            
            // Look for table-like patterns
            const tablePatterns = (text.match(/\w+\s*[:\-]\s*\d+/g) || []).length;
            const unitPatterns = (text.match(/\d+\.?\d*\s*(mg\/dl|mmol\/l|g\/dl|%|\w+\/\w+)/gi) || []).length;
            
            // Quality score calculation
            const qualityScore = 
              (charCount * 0.1) + 
              (confidence * 0.3) + 
              (numberCount * 2) + 
              (medicalTermCount * 10) + 
              (tablePatterns * 8) + 
              (unitPatterns * 12) +
              (wordCount > 10 ? 20 : 0) +
              (charCount > 100 ? 30 : 0);

            console.log(`[${method.name}-${config.name}] Score: ${qualityScore.toFixed(1)}, Chars: ${charCount}, Medical terms: ${medicalTermCount}, Units: ${unitPatterns}`);
            
            allResults.push({
              text,
              confidence,
              qualityScore,
              method: `${method.name}-${config.name}`,
              stats: { charCount, medicalTermCount, unitPatterns, tablePatterns }
            });

            if (qualityScore > bestResult.confidence) {
              bestResult = { text, confidence: qualityScore, method: `${method.name}-${config.name}` };
            }

          } catch (configError) {
            console.error(`OCR config ${config.name} failed:`, configError.message);
            continue;
          }
        }

      } catch (methodError) {
        console.error(`Preprocessing method ${method.name} failed:`, methodError.message);
        continue;
      }
    }

    // Skip desperate fallback attempt to save memory and processing time
    // If we have any reasonable text, just use it

    // Simple completion log
    console.log(`OCR processing complete. Text length: ${bestResult.text.length}`);
    
    // Return early if no meaningful text was found
    if (bestResult.text.length < 10) {
      return ' '; // Return space to avoid validation errors
    }

    return bestResult.text;

  } catch (error) {
    console.error('OCR extraction error:', error);
    // Instead of throwing an error, return a space character
    // This allows the document to be stored with manual entry requirement
    return ' ';
  }
}

module.exports = router;
