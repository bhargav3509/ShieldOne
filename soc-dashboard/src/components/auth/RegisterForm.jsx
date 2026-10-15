import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../App';

export default function RegisterForm({ setView, selectedPlan }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [validations, setValidations] = useState({
    length: false,
    upper: false,
    number: false,
  });

  useEffect(() => {
    setValidations({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
    });
  }, [password]);

  const allValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) { setError('Please meet all password requirements'); return; }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        plan: selectedPlan || 'personal'
      });
      setView('otp', email);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form fade-in">
      <h2>Create Account</h2>
      <p className="text-muted" style={{ marginBottom: 24, fontSize: '0.88rem' }}>
        Register for {selectedPlan === 'professional' ? 'Professional SOC Dashboard' : 'Personal Security Center'}
      </p>

      {error && <div className="anomaly-banner" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email Address</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', paddingRight: '80px' }}
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              id="register-toggle-password"
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

        <div className="password-validation">
          <div className={`val-item ${validations.length ? 'valid' : ''}`}>
            {validations.length ? 'PASS' : 'FAIL'} — At least 8 characters
          </div>
          <div className={`val-item ${validations.upper ? 'valid' : ''}`}>
            {validations.upper ? 'PASS' : 'FAIL'} — One uppercase letter
          </div>
          <div className={`val-item ${validations.number ? 'valid' : ''}`}>
            {validations.number ? 'PASS' : 'FAIL'} — One number
          </div>
        </div>

        <button
          type="submit"
          id="register-submit-btn"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 16, padding: '12px' }}
          disabled={!allValid || loading}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.88rem' }}>
        Already have an account?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); }}>Sign In</a>
      </p>
    </div>
  );
}
