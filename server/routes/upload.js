const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const authMiddleware = require('../utils/authMiddleware');
const Report = require('../models/Report');
const { extractHealthParameters } = require('../utils/parameterExtractor');

const router = express.Router();

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

      if (!extractedText || extractedText.trim().length === 0) {
        console.log('No text extracted from file');
        return res.status(400).json({ 
          error: 'No text could be extracted from the file. Please ensure the image is clear and contains readable text.' 
        });
      }

      console.log('Extracted text length:', extractedText.length);
      console.log('First 500 characters:', extractedText.substring(0, 500));

      // Extract health parameters from the text
      const healthParameters = extractHealthParameters(extractedText);

      console.log('Extracted parameters:', healthParameters);

      if (!healthParameters || healthParameters.length === 0) {
        console.log('No health parameters found in extracted text');
        return res.status(400).json({ 
          error: 'No health parameters found in the document. Please ensure this is a valid lab report.' 
        });
      }

      // Save report to database (without file path since we don't store files)
      const report = new Report({
        userId: req.user.id,
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        extractedText: extractedText,
        healthParameters: healthParameters,
        createdAt: new Date()
      });

      const savedReport = await report.save();

      res.json({
        success: true,
        reportId: savedReport._id,
        filename: req.file.originalname,
        healthParameters: healthParameters,
        extractedParameterCount: healthParameters.length
      });

    } catch (extractionError) {
      console.error('File processing error:', extractionError);
      throw extractionError;
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
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Helper function to extract text from image buffer using Tesseract OCR
async function extractTextFromImageBuffer(buffer) {
  try {
    console.log('Starting advanced OCR processing for lab reports...');
    
    // Get image metadata for better processing decisions
    const metadata = await sharp(buffer).metadata();
    console.log(`Image info: ${metadata.width}x${metadata.height}, ${metadata.format}, ${metadata.channels} channels`);
    
    // Advanced preprocessing methods specifically optimized for lab reports
    const preprocessingMethods = [
      // Method 1: Medical document optimized - high DPI with noise reduction
      {
        name: 'Medical Document',
        process: () => sharp(buffer)
          .resize({ 
            width: Math.max(3500, metadata.width * 2), 
            height: Math.max(3500, metadata.height * 2), 
            fit: 'inside',
            kernel: sharp.kernel.lanczos3 // Better upscaling
          })
          .grayscale()
          .median(2) // Remove salt and pepper noise
          .normalize() // Auto-adjust contrast
          .linear(1.3, -35) // Enhance contrast specifically for text
          .threshold(128, { grayscale: false }) // Clean binary threshold
          .png({ quality: 100, compressionLevel: 0 })
          .toBuffer()
      },
      // Method 2: Table structure preservation
      {
        name: 'Table Preserving',
        process: () => sharp(buffer)
          .resize({ width: 4000, height: 4000, fit: 'inside', withoutEnlargement: false })
          .grayscale()
          .blur(0.5) // Very slight blur to connect broken characters
          .sharpen({ sigma: 1.2, m1: 0, m2: 3, x1: 3, y2: 15, y3: 30 })
          .normalize()
          .modulate({ brightness: 1.15, saturation: 0 })
          .linear(1.4, -40) // Strong contrast
          .png({ quality: 100 })
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

    // Try each preprocessing method with enhanced OCR configurations
    for (const method of preprocessingMethods) {
      try {
        console.log(`Processing with method: ${method.name}`);
        const processedBuffer = await method.process();

        // Multiple OCR passes with different configurations
        const ocrConfigs = [
          // Config 1: Optimized for medical/lab reports
          {
            name: 'Lab Report Optimized',
            options: {
              tessedit_pageseg_mode: Tesseract.PSM.AUTO,
              tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
              tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,()-/:% <>',
              preserve_interword_spaces: '1',
              tessedit_write_images: '0',
              user_defined_dpi: '300'
            }
          },
          // Config 2: Table-focused
          {
            name: 'Table Focused',
            options: {
              tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
              tessedit_ocr_engine_mode: Tesseract.OEM.DEFAULT,
              preserve_interword_spaces: '1',
              user_defined_dpi: '300',
              tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,()-/:% <>'
            }
          }
        ];

        for (const config of ocrConfigs) {
          try {
            const { data: { text, confidence } } = await Tesseract.recognize(processedBuffer, 'eng', {
              logger: m => {
                if (m.status === 'recognizing text') {
                  console.log(`[${method.name}-${config.name}] OCR Progress: ${Math.round(m.progress * 100)}%`);
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

    // If results are still poor, try a final desperate attempt with different settings
    if (bestResult.confidence < 50 && bestResult.text.length < 200) {
      console.log('Attempting final fallback OCR with relaxed settings...');
      try {
        const desperation = await sharp(buffer)
          .resize({ width: 5000, height: 5000, fit: 'inside' })
          .grayscale()
          .normalize()
          .modulate({ brightness: 1.2 })
          .png({ quality: 100 })
          .toBuffer();

        const { data: { text: desperateText } } = await Tesseract.recognize(desperation, 'eng', {
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_ocr_engine_mode: Tesseract.OEM.DEFAULT,
          preserve_interword_spaces: '1',
          tessedit_char_whitelist: '', // No whitelist - allow all characters
          user_defined_dpi: '150'
        });

        if (desperateText.length > bestResult.text.length && desperateText.length > 50) {
          console.log('Fallback method yielded better results');
          bestResult.text = desperateText;
          bestResult.method += ' + Fallback';
        }
      } catch (desperateError) {
        console.error('Final fallback OCR failed:', desperateError.message);
      }
    }

    // Log summary of all attempts
    console.log(`\n=== OCR PROCESSING SUMMARY ===`);
    console.log(`Processed ${bestResult.processedCount} OCR attempts`);
    console.log(`Best method: ${bestResult.method}`);
    console.log(`Best score: ${bestResult.confidence.toFixed(1)}`);
    console.log(`Final text length: ${bestResult.text.length}`);
    console.log(`Text preview (first 300 chars):`);
    console.log(bestResult.text.substring(0, 300));
    console.log(`=== END SUMMARY ===\n`);

    return bestResult.text;

  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error('Failed to extract text from image. Please ensure the image is clear and contains readable text.');
  }
}

module.exports = router;
