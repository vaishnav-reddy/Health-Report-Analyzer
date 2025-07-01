import React, { useState, useEffect } from 'react';
import { fetchTrendData } from '../utils/api';

const ReportTable = ({ data, onTrendData }) => {
  const [sortBy, setSortBy] = useState('category');
  const [filterBy, setFilterBy] = useState('all');
  const [showTrends, setShowTrends] = useState(false);

  const { healthParameters } = data;

  useEffect(() => {
    if (showTrends && data.reportId) {
      loadTrendData();
    }
  }, [showTrends, data.reportId]);

  const loadTrendData = async () => {
    try {
      const trends = await fetchTrendData(data.reportId);
      onTrendData(trends);
    } catch (error) {
      // Trend data loading failed silently
    }
  };

  const handleToggleTrends = () => {
    const newShowTrends = !showTrends;
    setShowTrends(newShowTrends);
    
    // Clear trend data when hiding trends
    if (!newShowTrends) {
      onTrendData(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Normal': return '✅';
      case 'High': return '⚠️';
      case 'Low': return '🔻';
      default: return '❓';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Normal': return 'status-normal';
      case 'High': return 'status-high';
      case 'Low': return 'status-low';
      default: return 'status-unknown';
    }
  };

  const filteredAndSortedData = healthParameters
    .filter(param => {
      if (filterBy === 'all') return true;
      if (filterBy === 'abnormal') return param.status !== 'Normal';
      return param.status.toLowerCase() === filterBy;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const groupedByCategory = filteredAndSortedData.reduce((groups, param) => {
    const category = param.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(param);
    return groups;
  }, {});

  const abnormalCount = healthParameters.filter(p => p.status !== 'Normal').length;

  return (
    <div className="report-table-container">
      <div className="table-header">
        <div className="table-summary">
          <div className="summary-card">
            <span className="summary-number">{healthParameters.length}</span>
            <span className="summary-label">Total Parameters</span>
          </div>
          <div className="summary-card">
            <span className="summary-number">{healthParameters.length - abnormalCount}</span>
            <span className="summary-label">Normal</span>
          </div>
          <div className="summary-card abnormal">
            <span className="summary-number">{abnormalCount}</span>
            <span className="summary-label">Needs Attention</span>
          </div>
        </div>

        <div className="table-controls">
          <div className="control-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="category">Category</option>
              <option value="name">Parameter Name</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="control-group">
            <label>Filter:</label>
            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
              <option value="all">All Parameters</option>
              <option value="abnormal">Needs Attention</option>
              <option value="normal">Normal Only</option>
              <option value="high">High Only</option>
              <option value="low">Low Only</option>
            </select>
          </div>

          <button 
            className={`btn-trends ${showTrends ? 'active' : ''}`}
            onClick={handleToggleTrends}
          >
            {showTrends ? '📈 Hide Trends' : '📊 Show Trends'}
          </button>
        </div>
      </div>

      <div className="parameters-display">
        {Object.entries(groupedByCategory).map(([category, parameters]) => (
          <div key={category} className="category-section">
            <h3 className="category-title">{category}</h3>
            
            <div className="parameters-grid">
              {parameters.map((param, index) => (
                <div key={index} className={`parameter-card ${getStatusClass(param.status)}`}>
                  <div className="parameter-header">
                    <span className="parameter-name">{param.name}</span>
                    <span className="status-icon">{getStatusIcon(param.status)}</span>
                  </div>
                  
                  <div className="parameter-value">
                    <span className="value">{param.value}</span>
                    <span className="unit">{param.unit}</span>
                  </div>
                  
                  <div className="parameter-range">
                    Normal: {param.normalRange}
                  </div>
                  
                  <div className={`parameter-status ${getStatusClass(param.status)}`}>
                    {param.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedData.length === 0 && (
        <div className="no-results">
          <p>No parameters match the current filter.</p>
        </div>
      )}
    </div>
  );
};

export default ReportTable;
