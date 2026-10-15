import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import OTPForm from './OTPForm';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function AuthContainer({ onLogin }) {
  // views: 'login', 'register', 'otp', 'forgot'
  const [view, setView] = useState('login');
  const [emailForOtp, setEmailForOtp] = useState('');

  const containerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 24, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, []);

  const changeView = (newView, email = '') => {
    if (email) setEmailForOtp(email);
    setView(newView);
  };

  useEffect(() => {
    gsap.fromTo(
      '.auth-form',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
    );
  }, [view]);

  return (
    <div className="auth-overlay">
      <div className="auth-container" ref={containerRef}>
        <div className="auth-header">
          <h1 className="header-title" style={{ fontSize: '1.5rem', marginBottom: 4 }}>ShieldOne</h1>
          <div className="live-badge" style={{ display: 'inline-flex' }}>
            <span className="live-dot"></span>
            Security Platform
          </div>
        </div>

        <div className="auth-body">
          {view === 'login' && (
            <LoginForm onLogin={onLogin} setView={changeView} />
          )}
          {view === 'register' && (
            <RegisterForm setView={changeView} />
          )}
          {view === 'otp' && (
            <OTPForm email={emailForOtp} onLogin={onLogin} />
          )}
          {view === 'forgot' && (
            <ForgotPasswordForm setView={changeView} />
          )}
        </div>
      </div>
    </div>
  );
}
