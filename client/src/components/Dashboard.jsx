import React from 'react';
import DataVisualization from './DataVisualization';
import '../styles/css/dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>

      {/* Data Visualization */}
      <DataVisualization />

      {/* Other Reports / Placeholder */}
      <div className="data-vis-container">
        <div className="chart-title">Other Reports</div>
        <div className="chart-placeholder">Other charts will go here</div>
      </div>
    </div>
  );
}
