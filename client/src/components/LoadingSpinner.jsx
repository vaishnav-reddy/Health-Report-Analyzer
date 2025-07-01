import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      <div className="loading-text">
        <h3>🔍 Processing Your Report...</h3>
        <p>Extracting health parameters from your document</p>
        <div className="loading-steps">
          <div className="step">📄 Reading document...</div>
          <div className="step">🔤 Extracting text...</div>
          <div className="step">🧬 Analyzing parameters...</div>
          <div className="step">📊 Generating insights...</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
