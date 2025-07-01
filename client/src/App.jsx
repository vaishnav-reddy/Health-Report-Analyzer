import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import UserProfile from './components/UserProfile';
import FileUpload from './components/FileUpload';
import ReportTable from './components/ReportTable';
import TrendChart from './components/TrendChart';
import LoadingSpinner from './components/LoadingSpinner';
import { getCurrentUser } from './utils/api';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check for existing user session when app loads
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const userInfo = await getCurrentUser();
          setUser(JSON.parse(userData));
        } catch (error) {
          // Clear invalid session data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setReportData(null);
    setTrendData(null);
    setError(null);
  };

  const handleFileProcessed = (data) => {
    setReportData(data);
    setError(null);
  };

  const handleTrendData = (trends) => {
    setTrendData(trends);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setReportData(null);
    setTrendData(null);
  };

  const handleReset = () => {
    setReportData(null);
    setTrendData(null);
    setError(null);
  };

  // Display loading screen while checking authentication status
  if (authLoading) {
    return (
      <div className="app">
        <div className="auth-loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Show login form for unauthenticated users
  if (!user) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>🏥 Health Report Analyzer</h1>
          <p>Secure platform to analyze your health reports with AI insights</p>
        </header>
        <main className="app-main">
          <AuthForm onLogin={handleLogin} />
        </main>
        <footer className="app-footer">
          <p>⚠️ This tool is for informational purposes only. Always consult with healthcare professionals.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>🏥 Health Report Analyzer</h1>
            <p>Welcome back, {user.firstName}! Upload your lab report and get instant insights.</p>
          </div>
          <UserProfile user={user} onLogout={handleLogout} />
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <span>❌ {error}</span>
            <button onClick={handleReset} className="btn-retry">Try Again</button>
          </div>
        )}

        {loading && <LoadingSpinner />}

        {!reportData && !loading && (
          <FileUpload 
            onFileProcessed={handleFileProcessed}
            onError={handleError}
            onLoadingChange={setLoading}
          />
        )}

        {reportData && (
          <div className="results-section">
            <div className="results-header">
              <h2>📊 Analysis Results</h2>
              <button onClick={handleReset} className="btn-new-upload">
                Upload New Report
              </button>
            </div>

            <ReportTable 
              data={reportData}
              onTrendData={handleTrendData}
            />

            {trendData && (
              <TrendChart 
                data={trendData}
                reportId={reportData.reportId}
              />
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>⚠️ This tool is for informational purposes only. Always consult with healthcare professionals.</p>
      </footer>
    </div>
  );
}

export default App;
