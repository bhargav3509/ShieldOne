import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

import Header from './components/Header';
import ChatBot from './components/ChatBot';

import DashboardTab from './components/tabs/DashboardTab';
import IncidentsTab from './components/tabs/IncidentsTab';
import ThreatIntelTab from './components/tabs/ThreatIntelTab';
import EndpointsTab from './components/tabs/EndpointsTab';
import ComplianceTab from './components/tabs/ComplianceTab';
import AuthContainer from './components/auth/AuthContainer';
import LandingPage from './components/LandingPage';

const API_URL = import.meta.env.VITE_API_URL || 'https://soc-dashboard-1-m5gr.onrender.com';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attacks, setAttacks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    severityCounts: { low: 0, medium: 0, high: 0 },
    typeCounts: {},
    topType: null,
    uniqueIPs: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);

  // --- Theme State (persisted in localStorage) ---
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('soc-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('soc-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // --- Connect to WebSockets for real-time data ---
  useEffect(() => {
    const socket = io(API_URL);

    socket.on('connect', () => {
      setError(null);
    });

    socket.on('connect_error', () => {
      setError('Unable to connect to real-time data stream. Is the backend server running?');
    });

    socket.on('dashboardData', (data) => {
      setAttacks(data.attacks);
      setStats(data.stats);

      // Build chart data from stats typeCounts
      const cd = Object.entries(data.stats.typeCounts).map(([type, count]) => ({
        type,
        count,
      }));
      setChartData(cd);
      setError(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // --- Risk Score Calculation ---
  const severityScore = attacks.reduce((acc, a) => {
    if (a.severity === 'high') return acc + 5;
    if (a.severity === 'medium') return acc + 3;
    return acc + 1;
  }, 0);

  const avgSeverity = attacks.length ? severityScore / attacks.length : 0;
  const highCount = stats.severityCounts?.high || 0;
  const anomaly = highCount > 5;

  let riskScore = Math.floor(avgSeverity * 20);
  if (highCount > 5) riskScore += 15;
  if (anomaly) riskScore += 10;
  riskScore = Math.min(100, riskScore);

  // --- AI Explain ---
  const handleExplain = useCallback(async (attack) => {
    const res = await axios.post(`${API_URL}/ai-explain`, { attack });
    return res.data.text;
  }, []);

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} theme={theme} />;
  }

  if (!isAuthenticated) {
    return <AuthContainer onLogin={(token) => setIsAuthenticated(true)} />;
  }

  return (
    <div className="dashboard">
      <Header 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {error && (
        <div className="anomaly-banner" style={{ marginBottom: 20 }}>
          <span>⚠</span> {error}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <DashboardTab 
          riskScore={riskScore} 
          anomaly={anomaly} 
          stats={stats} 
          chartData={chartData} 
          attacks={attacks} 
          theme={theme} 
          handleExplain={handleExplain} 
        />
      )}

      {activeTab === 'incidents' && <IncidentsTab />}
      {activeTab === 'threats' && <ThreatIntelTab />}
      {activeTab === 'endpoints' && <EndpointsTab />}
      {activeTab === 'compliance' && <ComplianceTab />}

      <ChatBot />
    </div>
  );
}

export default App;