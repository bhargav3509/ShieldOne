import { useState, useRef } from 'react';
import axios from 'axios';

export default function OTPForm({ email, onLogin }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otp];
    const lastChar = val.slice(-1);
    newOtp[index] = lastChar;
    setOtp(newOtp);

    // Auto focus next
    if (lastChar && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    inputs.current[nextIndex].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;

    try {
      const res = await axios.post('http://localhost:5000/auth/verify-otp', { email, otp: code });
      onLogin(res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    }
  };

  return (
    <div className="auth-form fade-in">
      <h2>Verify OTP</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Enter the 6-digit code sent to {email}</p>
      
      {error && <div className="anomaly-banner" style={{ marginBottom: 16 }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="otp-container">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={el => inputs.current[idx] = el}
              type="text"
              className="otp-input"
              value={digit}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPaste={handlePaste}
              maxLength={1}
            />
          ))}
        </div>
        
        <button type="submit" className="btn" style={{ width: '100%', marginTop: 24 }}>
          Verify Account
        </button>
      </form>
    </div>
  );
}
