import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

import Header from './components/Header';
import ChatBot from './components/ChatBot';
import DashboardTab from './components/tabs/DashboardTab';
import IncidentsTab from './components/tabs/IncidentsTab';
import ThreatIntelTab from './components/tabs/ThreatIntelTab';
import EndpointsTab from './components/tabs/EndpointsTab';
import ComplianceTab from './components/tabs/ComplianceTab';
import AttackAnalyzerTab from './components/tabs/AttackAnalyzerTab';
import AuthContainer from './components/auth/AuthContainer';
import LandingPage from './components/LandingPage';
import PersonalCenter from './components/personal/PersonalCenter';

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001'
    : 'https://soc-dashboard-1-m5gr.onrender.com');

// ─── Auth Context ──────────────────────────────────────────────
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// ─── Protected Route ───────────────────────────────────────────
function ProtectedRoute({ children, requirePlan }) {
  const { isAuthenticated, userPlan } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requirePlan === 'professional' && userPlan !== 'professional') {
    return <Navigate to="/personal" replace />;
  }
  if (requirePlan === 'personal' && userPlan !== 'personal') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// ─── Professional SOC Layout ───────────────────────────────────
function ProfessionalLayout({ children }) {
  const { theme, toggleTheme, userEmail, handleLogout, handleSwitchPlan } = useAuth();
  return (
    <div className="dashboard">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        userEmail={userEmail}
        onLogout={handleLogout}
        onSwitchPlan={handleSwitchPlan}
      />
      {children}
      <ChatBot />
    </div>
  );
}

// ─── Root App ──────────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated, userPlan, theme, error, attacks, stats, chartData, handleExplain, handleLogin, handleLogout, handleSwitchPlan, toggleTheme, userEmail } = useAuth();

  const riskScore = (() => {
    const severityScore = attacks.reduce((acc, a) => {
      if (a.severity === 'high') return acc + 5;
      if (a.severity === 'medium') return acc + 3;
      return acc + 1;
    }, 0);
    const avgSeverity = attacks.length ? severityScore / attacks.length : 0;
    const highCount = stats.severityCounts?.high || 0;
    const anomaly = highCount > 5;
    let score = Math.floor(avgSeverity * 20);
    if (highCount > 5) score += 15;
    if (anomaly) score += 10;
    return Math.min(100, score);
  })();

  const anomaly = (stats.severityCounts?.high || 0) > 5;

  return (
    <Routes>
      {/* Landing */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={userPlan === 'professional' ? '/dashboard' : '/personal'} replace />
          ) : (
            <LandingPage theme={theme} />
          )
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={userPlan === 'professional' ? '/dashboard' : '/personal'} replace />
          ) : (
            <AuthContainer onLogin={handleLogin} />
          )
        }
      />

      {/* Personal Center — nested tab routes */}
      <Route
        path="/personal"
        element={
          <ProtectedRoute requirePlan="personal">
            <PersonalCenter
              theme={theme}
              onToggleTheme={toggleTheme}
              userEmail={userEmail}
              onLogout={handleLogout}
              onSwitchPlan={handleSwitchPlan}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="scam" replace />} />
        <Route path="scam" element={null} />
        <Route path="url" element={null} />
        <Route path="assistant" element={null} />
        <Route path="response" element={null} />
        <Route path="history" element={null} />
      </Route>

      {/* Professional Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requirePlan="professional">
            <ProfessionalLayout>
              {error && <div className="anomaly-banner" style={{ marginBottom: 20 }}>{error}</div>}
              <DashboardTab
                riskScore={riskScore}
                anomaly={anomaly}
                stats={stats}
                chartData={chartData}
                attacks={attacks}
                theme={theme}
                handleExplain={handleExplain}
              />
            </ProfessionalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analyzer"
        element={
          <ProtectedRoute requirePlan="professional">
            <ProfessionalLayout>
              <AttackAnalyzerTab />
            </ProfessionalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents"
        element={
          <ProtectedRoute requirePlan="professional">
            <ProfessionalLayout>
              <IncidentsTab />
            </ProfessionalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/threats"
        element={
          <ProtectedRoute requirePlan="professional">
            <ProfessionalLayout>
              <ThreatIntelTab />
            </ProfessionalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/endpoints"
        element={
          <ProtectedRoute requirePlan="professional">
            <ProfessionalLayout>
              <EndpointsTab />
            </ProfessionalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/compliance"
        element={
          <ProtectedRoute requirePlan="professional">
            <ProfessionalLayout>
              <ComplianceTab />
            </ProfessionalLayout>
          </ProtectedRoute>
        }
      />


      {/* Fallback */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated
                ? userPlan === 'professional'
                  ? '/dashboard'
                  : '/personal'
                : '/'
            }
            replace
          />
        }
      />
    </Routes>
  );
}

// ─── Auth Provider ─────────────────────────────────────────────
function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('soc-token'));
  const [userPlan, setUserPlan] = useState(() => localStorage.getItem('soc-plan') || 'personal');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('soc-email') || '');
  const [theme, setTheme] = useState(() => localStorage.getItem('soc-theme') || 'dark');

  const [attacks, setAttacks] = useState([]);
  const [stats, setStats] = useState({ total: 0, severityCounts: { low: 0, medium: 0, high: 0 }, typeCounts: {}, topType: null, uniqueIPs: 0 });
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('soc-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'dark' ? 'light' : 'dark'), []);

  // WebSocket for professional plan
  useEffect(() => {
    if (!isAuthenticated || userPlan !== 'professional') return;
    const socket = io(API_URL);
    socket.on('connect', () => setError(null));
    socket.on('connect_error', () => setError('Unable to connect to real-time data stream. Is the backend server running?'));
    socket.on('dashboardData', (data) => {
      setAttacks(data.attacks);
      setStats(data.stats);
      setChartData(Object.entries(data.stats.typeCounts).map(([type, count]) => ({ type, count })));
      setError(null);
    });
    return () => socket.disconnect();
  }, [isAuthenticated, userPlan]);

  const handleExplain = useCallback(async (attack) => {
    const res = await axios.post(`${API_URL}/ai-explain`, { attack });
    return res.data.text;
  }, []);

  const handleLogin = useCallback((token, plan, email) => {
    if (token) localStorage.setItem('soc-token', token);
    const chosenPlan = plan || 'personal';
    localStorage.setItem('soc-plan', chosenPlan);
    if (email) localStorage.setItem('soc-email', email);

    setIsAuthenticated(true);
    setUserPlan(chosenPlan);
    setUserEmail(email || '');

    navigate(chosenPlan === 'professional' ? '/dashboard' : '/personal/scam', { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('soc-token');
    localStorage.removeItem('soc-plan');
    localStorage.removeItem('soc-email');
    setIsAuthenticated(false);
    setUserPlan('personal');
    setUserEmail('');
    navigate('/', { replace: true });
  }, [navigate]);

  const handleSwitchPlan = useCallback((newPlan) => {
    localStorage.setItem('soc-plan', newPlan);
    setUserPlan(newPlan);
    navigate(newPlan === 'professional' ? '/dashboard' : '/personal/scam', { replace: true });
  }, [navigate]);

  // Redirect on first load if already authenticated
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      navigate(userPlan === 'professional' ? '/dashboard' : '/personal/scam', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const authValue = {
    isAuthenticated, userPlan, userEmail, theme,
    error, attacks, stats, chartData,
    toggleTheme, handleLogin, handleLogout, handleSwitchPlan, handleExplain,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <AppRoutes />
    </AuthContext.Provider>
  );
}

export default App;