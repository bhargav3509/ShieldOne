import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Header({ theme, onToggleTheme, activeTab, setActiveTab }) {
  const headerRef = useRef(null);
  const titleRef = useRef(null);
  const badgeRef = useRef(null);
  const toggleBtnRef = useRef(null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'incidents', label: 'Incidents' },
    { id: 'threats', label: 'Threats & Network' },
    { id: 'endpoints', label: 'Endpoints' },
    { id: 'compliance', label: 'Compliance & UEBA' }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      gsap.from(badgeRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        delay: 0.4,
        ease: 'back.out(1.7)',
      });

      gsap.from('.header-right', {
        x: 30,
        opacity: 0,
        duration: 0.6,
        delay: 0.3,
        ease: 'power2.out',
      });
      
      gsap.from('.header-tabs', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: 'power2.out',
      });
    }, headerRef);

    return () => ctx.revert();
  }, []);

  // Animate toggle button on theme switch
  const handleToggle = () => {
    if (toggleBtnRef.current) {
      gsap.fromTo(
        toggleBtnRef.current,
        { rotate: 0, scale: 0.8 },
        { rotate: 360, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }
      );
    }
    onToggleTheme();
  };

  const handlePrint = () => {
    window.print();
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="header" ref={headerRef}>
      <div className="header-top">
        <div className="header-left">
          <div ref={titleRef}>
            <h1 className="header-title">SOC Dashboard</h1>
            <p className="header-subtitle">Security Operations Center — Enterprise</p>
          </div>
          <span className="live-badge" ref={badgeRef}>
            <span className="live-dot"></span>
            Live
          </span>
        </div>

        <div className="header-right">
          <button className="btn btn-ghost" onClick={handlePrint}>Generate Report</button>
          <span style={{ opacity: 0.3, margin: '0 8px' }}>|</span>
          <span>{dateStr}</span>
          <span style={{ opacity: 0.3, margin: '0 8px' }}>|</span>
          <span>{timeStr}</span>
          <button
            className="theme-toggle"
            ref={toggleBtnRef}
            onClick={handleToggle}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ marginLeft: '12px' }}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
      
      <div className="header-bottom">
        <div className="header-tabs">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab && setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
