import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';

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

export default function LoginForm({ onLogin, setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const formRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.anim-item', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
      });
    }, formRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/auth/login', { email, password });
      onLogin(res.data.token);
    } catch (err) {
      if (err.response?.status === 403) {
        setView('otp', email);
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    }
  };

  return (
    <div className="auth-form" ref={formRef}>
      <h2 className="anim-item">Welcome Back</h2>
      <p className="text-muted anim-item" style={{ marginBottom: 24 }}>Sign in to access your SOC Dashboard</p>
      
      {error && <div className="anomaly-banner anim-item" style={{ marginBottom: 16 }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="input-group anim-item">
          <label>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="analyst@soc.com"
          />
        </div>
        
        <div className="input-group anim-item">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label>Password</label>
            <a href="#" className="link-muted" onClick={(e) => { e.preventDefault(); setView('forgot'); }}>Forgot Password?</a>
          </div>
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
        
        <button type="submit" className="btn anim-item" style={{ width: '100%', marginTop: 8 }}>Sign In</button>
      </form>
      
      <p className="anim-item" style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem' }}>
        Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setView('register'); }}>Sign Up</a>
      </p>
    </div>
  );
}
