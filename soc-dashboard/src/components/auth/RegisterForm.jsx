import { useState, useEffect } from 'react';
import axios from 'axios';

const PixelEyeOpen = () => (
  <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
    <rect x="5" y="4" width="6" height="1"/>
    <rect x="5" y="11" width="6" height="1"/>
    <rect x="3" y="5" width="2" height="1"/>
    <rect x="11" y="5" width="2" height="1"/>
    <rect x="3" y="10" width="2" height="1"/>
    <rect x="11" y="10" width="2" height="1"/>
    <rect x="1" y="6" width="2" height="4"/>
    <rect x="13" y="6" width="2" height="4"/>
    <rect x="6" y="6" width="4" height="4"/>
  </svg>
);

const PixelEyeClosed = () => (
  <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
    <rect x="5" y="4" width="6" height="1"/>
    <rect x="5" y="11" width="6" height="1"/>
    <rect x="3" y="5" width="2" height="1"/>
    <rect x="11" y="5" width="2" height="1"/>
    <rect x="3" y="10" width="2" height="1"/>
    <rect x="11" y="10" width="2" height="1"/>
    <rect x="1" y="6" width="2" height="4"/>
    <rect x="13" y="6" width="2" height="4"/>
    <rect x="12" y="2" width="2" height="2"/>
    <rect x="10" y="4" width="2" height="2"/>
    <rect x="8" y="6" width="2" height="2"/>
    <rect x="6" y="8" width="2" height="2"/>
    <rect x="4" y="10" width="2" height="2"/>
    <rect x="2" y="12" width="2" height="2"/>
  </svg>
);

export default function RegisterForm({ setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password validation state
  const [validations, setValidations] = useState({
    length: false,
    upper: false,
    number: false,
    symbol: false
  });

  useEffect(() => {
    setValidations({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password)
    });
  }, [password]);

  const allValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) {
      setError('Please meet all password requirements');
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/register`, {
        email: email,
        password: password
      });
      
      // Auto-open Ethereal test email if available
      if (res.data.previewUrl) {
        window.open(res.data.previewUrl, '_blank');
      }
      
      setView('otp', email);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-form fade-in">
      <h2>Create Account</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Register for access to the SOC Dashboard</p>
      
      {error && <div className="anomaly-banner" style={{ marginBottom: 16 }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="analyst@soc.com"
          />
        </div>
        
        <div className="input-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                padding: '0'
              }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <PixelEyeOpen /> : <PixelEyeClosed />}
            </button>
          </div>
        </div>

        <div className="password-validation">
          <div className={`val-item ${validations.length ? 'valid' : ''}`}>✓ At least 8 characters</div>
          <div className={`val-item ${validations.upper ? 'valid' : ''}`}>✓ One uppercase letter</div>
          <div className={`val-item ${validations.number ? 'valid' : ''}`}>✓ One number</div>
          <div className={`val-item ${validations.symbol ? 'valid' : ''}`}>✓ One special character</div>
        </div>
        
        <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }} disabled={!allValid}>
          Sign Up
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem' }}>
        Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); }}>Sign In</a>
      </p>
    </div>
  );
}
