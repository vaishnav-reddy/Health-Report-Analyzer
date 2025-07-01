import React, { useState } from 'react';

const TrendChart = ({ data, reportId }) => {
  const [selectedParameter, setSelectedParameter] = useState(Object.keys(data)[0]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="trend-chart-container">
        <p>No trend data available.</p>
      </div>
    );
  }

  const currentTrend = data[selectedParameter];

  const getInsightIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'caution': return '🔻';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };

  const getInsightClass = (type) => {
    return `insight-${type}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Normal': return 'trend-normal';
      case 'High': return 'trend-high';
      case 'Low': return 'trend-low';
      default: return 'trend-unknown';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'Increasing': return '📈';
      case 'Decreasing': return '📉';
      case 'Stable': return '➡️';
      default: return '📊';
    }
  };

  return (
    <div className="trend-chart-container">
      <div className="trend-header">
        <h3>📈 Trend Analysis</h3>
        <div className="parameter-selector">
          <label>Select Parameter:</label>
          <select 
            value={selectedParameter} 
            onChange={(e) => setSelectedParameter(e.target.value)}
          >
            {Object.keys(data).map(param => (
              <option key={param} value={param}>{param}</option>
            ))}
          </select>
        </div>
      </div>

      {currentTrend && (
        <div className="trend-content">
          <div className="trend-summary">
            <div className="trend-info">
              <h4>{currentTrend.parameter}</h4>
              <div className="trend-direction">
                <span className="trend-icon">{getTrendIcon(currentTrend.trend)}</span>
                <span className="trend-text">{currentTrend.trend} Trend</span>
              </div>
            </div>
            <div className="trend-range">
              Normal Range: <strong>{currentTrend.normalRange} {currentTrend.unit}</strong>
            </div>
          </div>

          <div className="trend-chart">
            <div className="chart-area">
              <div className="chart-header">
                <span>6-Month Trend</span>
                <span className="chart-unit">({currentTrend.unit})</span>
              </div>
              
              <div className="chart-points">
                {currentTrend.data.map((point, index) => (
                  <div key={index} className="chart-point-container">
                    <div 
                      className={`chart-point ${getStatusClass(point.status)}`}
                      title={`${point.value} ${currentTrend.unit} - ${point.status}`}
                    >
                      <div className="point-value">{point.value}</div>
                    </div>
                    <div className="point-date">{formatDate(point.date)}</div>
                  </div>
                ))}
              </div>
              
              <div className="chart-line">
                <svg width="100%" height="4">
                  <line 
                    x1="0%" 
                    y1="2" 
                    x2="100%" 
                    y2="2" 
                    stroke="#e0e0e0" 
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="trend-insights">
            <h4>🔍 Insights & Recommendations</h4>
            <div className="insights-list">
              {currentTrend.insights && currentTrend.insights.length > 0 ? (
                currentTrend.insights.map((insight, index) => (
                  <div key={index} className={`insight-card ${getInsightClass(insight.type)}`}>
                    <span className="insight-icon">{getInsightIcon(insight.type)}</span>
                    <span className="insight-message">{insight.message}</span>
                  </div>
                ))
              ) : (
                <div className="insight-card insight-info">
                  <span className="insight-icon">📋</span>
                  <span className="insight-message">No specific insights available for this parameter.</span>
                </div>
              )}
            </div>
          </div>

          <div className="trend-disclaimer">
            <p>⚠️ <strong>Disclaimer:</strong> Trend data includes simulated historical values for demonstration purposes. 
            Always consult with healthcare professionals for medical advice.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendChart;
