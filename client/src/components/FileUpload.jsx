import React, { useState, useRef, useEffect } from 'react';
import { uploadFile } from '../utils/api';

const FileUpload = ({ onFileProcessed, onError, onLoadingChange }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingOcr, setProcessingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const ocrTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up the timer when component unmounts
  useEffect(() => {
    return () => {
      if (ocrTimerRef.current) {
        clearInterval(ocrTimerRef.current);
      }
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      onError('Please upload a PDF or image file (JPEG, JPG, PNG)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      onError('File size must be less than 10MB');
      return;
    }

    try {
      onLoadingChange(true);
      setUploadProgress(0);
      
      // Start showing OCR processing simulation if it's a PDF (likely to need OCR)
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setProcessingOcr(true);
        setOcrProgress(0);
        
        // Simulate OCR progress for visual feedback
        if (ocrTimerRef.current) {
          clearInterval(ocrTimerRef.current);
        }
        
        ocrTimerRef.current = setInterval(() => {
          setOcrProgress(prev => {
            // Slowly increment up to 95% (we'll hit 100% when done)
            if (prev >= 95) {
              return 95;
            }
            // Slower progression for longer timeouts (5 min)
            // Start faster and gradually slow down
            const increment = 
              prev < 20 ? 0.8 : 
              prev < 40 ? 0.5 : 
              prev < 60 ? 0.3 : 
              prev < 80 ? 0.2 : 0.1;
            return prev + increment;
          });
        }, 1000);
      }

      const result = await uploadFile(file, (progress) => {
        if (!processingOcr) {
          setUploadProgress(progress);
        }
      });
      
      // Clear any OCR simulation
      if (ocrTimerRef.current) {
        clearInterval(ocrTimerRef.current);
        setOcrProgress(100); // Show 100% when done
      }

      // Check if it's a scanned document that might need special handling
      if (result.isScannedDocument) {
        if (result.requiresManualEntry) {
          // Still process the file but warn the user
          onFileProcessed(result);
          // Also show a warning message
          onError('This appears to be a scanned document. No health parameters were automatically detected. You may need to enter the data manually.');
        } else {
          onFileProcessed(result);
          // Also show a warning that data might be incomplete
          onError('This appears to be a scanned document. Some health parameters were detected, but you may need to verify and complete the data.');
        }
      } else {
        // Normal processing for digital documents
        onFileProcessed(result);
      }
    } catch (error) {
      console.error('File upload error:', error);
      
      // Provide more helpful messages based on common issues
      if (error.message.includes('No text could be extracted')) {
        onError('No readable text found in your file. Please upload a health report with clear text content or try a different file format.');
      } else if (error.message.includes('No health parameters found')) {
        onError('We couldn\'t identify any health parameters in this document. Please ensure this is a standard health/lab report.');
      } else if (error.message.includes('timeout of')) {
        onError('Processing is taking longer than expected. The server might still be analyzing your document. Please try again in a moment or upload a clearer document.');
      } else {
        onError(error.message || 'Failed to process file');
      }
    } finally {
      onLoadingChange(false);
      setUploadProgress(0);
      setProcessingOcr(false);
      setOcrProgress(0);
      if (ocrTimerRef.current) {
        clearInterval(ocrTimerRef.current);
      }
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-container">
      <div 
        className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="upload-icon">📄</div>
        <h3>Upload Your Health Report</h3>
        <p>Drag and drop your PDF or image file here, or click to browse</p>
        <p className="file-types">Supported: PDF, JPEG, JPG, PNG (max 10MB)</p>
        
        {uploadProgress > 0 && !processingOcr && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span>{uploadProgress}% uploaded</span>
          </div>
        )}
        
        {processingOcr && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${ocrProgress}%` }}
              ></div>
            </div>
            <span>{ocrProgress < 100 ? 'Analyzing document with OCR...' : 'Analysis complete!'}</span>
            <p className="ocr-note">OCR processing can take up to 5 minutes for complex documents</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div className="upload-tips">
        <h4>📋 Tips for better results:</h4>
        <ul>
          <li>Ensure the document is clear and well-lit</li>
          <li>Include the full lab report with parameter names and values</li>
          <li>Avoid blurry or skewed images</li>
          <li>Make sure text is readable and not cut off</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;
