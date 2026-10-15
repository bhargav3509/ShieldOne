import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import { API_URL } from '../../App';

export default function LoginForm({ onLogin, setView, selectedPlan }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.anim-item', { y: 16, opacity: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    }, formRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      onLogin(res.data.token, res.data.plan || selectedPlan, res.data.email || email);
    } catch (err) {
      if (err.response?.status === 403) {
        setView('otp', email);
      } else {
        setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form" ref={formRef}>
      <h2 className="anim-item">Welcome Back</h2>
      <p className="text-muted anim-item" style={{ marginBottom: 24, fontSize: '0.88rem' }}>
        Sign in to access your {selectedPlan === 'professional' ? 'Professional SOC Dashboard' : 'Personal Security Center'}
      </p>

      {error && <div className="anomaly-banner anim-item" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group anim-item">
          <label>Email Address</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div className="input-group anim-item">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label>Password</label>
            <a href="#" className="link-muted" onClick={(e) => { e.preventDefault(); setView('forgot'); }}>
              Forgot Password?
            </a>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', paddingRight: '80px' }}
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              id="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                fontSize: '0.72rem', fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.05em'
              }}
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          id="login-submit-btn"
          className="btn btn-primary anim-item"
          style={{ width: '100%', marginTop: 8, padding: '12px' }}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="anim-item" style={{ textAlign: 'center', marginTop: 20, fontSize: '0.88rem' }}>
        Don't have an account?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); setView('register'); }}>
          Sign Up
        </a>
      </p>
    </div>
  );
}
