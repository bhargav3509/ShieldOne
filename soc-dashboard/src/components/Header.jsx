import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';

export default function Header({ theme, onToggleTheme, userEmail, onLogout, onSwitchPlan }) {
  const headerRef = useRef(null);
  const titleRef = useRef(null);
  const badgeRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'analyzer', label: 'AI Analyzer', path: '/analyzer' },
    { id: 'incidents', label: 'Incidents', path: '/incidents' },
    { id: 'threats', label: 'Threats', path: '/threats' },
    { id: 'endpoints', label: 'Endpoints', path: '/endpoints' },
    { id: 'compliance', label: 'Compliance', path: '/compliance' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' });
      gsap.from(badgeRef.current, { scale: 0, opacity: 0, duration: 0.4, delay: 0.3, ease: 'back.out(1.7)' });
      gsap.from('.header-right', { x: 20, opacity: 0, duration: 0.5, delay: 0.2, ease: 'power2.out' });
      gsap.from('.header-tabs', { y: 16, opacity: 0, duration: 0.5, delay: 0.15, ease: 'power2.out' });
    }, headerRef);
    return () => ctx.revert();
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const activeTab = tabs.find(t => t.path === location.pathname)?.id || 'dashboard';

  return (
    <header className="header" ref={headerRef}>
      <div className="header-top">
        <div className="header-left">
          <div ref={titleRef}>
            <h1 className="header-title">ShieldOne</h1>
            <p className="header-subtitle">Professional SOC — Enterprise</p>
          </div>
          <span className="live-badge" ref={badgeRef}>
            <span className="live-dot"></span>
            Live
          </span>
        </div>

        <div className="header-right">
          <button
            className="btn btn-ghost"
            onClick={window.print}
            id="generate-report-btn"
          >
            Generate Report
          </button>
          <span className="header-divider">|</span>
          <span className="header-meta">{dateStr}</span>
          <span className="header-divider">|</span>
          <span className="header-meta">{timeStr}</span>
          {userEmail && (
            <>
              <span className="header-divider">|</span>
              <span className="header-meta" style={{ opacity: 0.6, fontSize: '0.78rem' }}>{userEmail}</span>
            </>
          )}
          <button
            className="btn btn-ghost"
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            style={{ marginLeft: 4, padding: '6px 12px', fontSize: '0.72rem' }}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          {onSwitchPlan && (
            <button
              className="btn btn-ghost"
              id="switch-to-personal-btn"
              onClick={() => onSwitchPlan('personal')}
              style={{ marginLeft: 2, padding: '6px 12px', fontSize: '0.72rem', borderColor: 'var(--accent, #6366f1)', color: 'var(--accent, #6366f1)' }}
            >
              Personal Mode ↗
            </button>
          )}
          {onLogout && (
            <button
              className="btn btn-ghost"
              id="logout-btn"
              onClick={onLogout}
              style={{ marginLeft: 2, padding: '6px 12px', fontSize: '0.72rem' }}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      <div className="header-bottom">
        <div className="header-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
