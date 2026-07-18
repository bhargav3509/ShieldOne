import { useState } from 'react';
import axios from 'axios';

export default function ForgotPasswordForm({ setView }) {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/forgot-password`, { email });
      
      if (res.data.previewUrl) {
        window.open(res.data.previewUrl, '_blank');
      }

      setOtpSent(true);
      setMsg('If the email exists, a reset OTP was sent.');
      setError('');
    } catch (err) {
      setError('Failed to request password reset');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/reset-password`, { email, otp, newPassword });
      setView('login');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    }
  };

  return (
    <div className="auth-form fade-in">
      <h2>Reset Password</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Enter your email to receive a recovery code.</p>
      
      {error && <div className="anomaly-banner" style={{ marginBottom: 16 }}>{error}</div>}
      {msg && <div className="badge badge-success" style={{ display: 'block', marginBottom: 16 }}>{msg}</div>}
      
      {!otpSent ? (
        <form onSubmit={handleSendOTP}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 8 }}>Send Recovery Code</button>
        </form>
      ) : (
        <form onSubmit={handleReset}>
          <div className="input-group">
            <label>6-Digit Code</label>
            <input 
              type="text" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label>New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 8 }}>Update Password</button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem' }}>
        Remembered it? <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); }}>Sign In</a>
      </p>
    </div>
  );
}
