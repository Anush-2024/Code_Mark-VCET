import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, sendOTP } from '../services/apiService';

export default function OTPVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, phone, email } = location.state || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    const t = setInterval(() => setTimer(p => p > 0 ? p - 1 : 0), 1000);
    refs[0].current?.focus();
    return () => clearInterval(t);
  }, []);

  const handleInput = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) refs[idx + 1].current?.focus();
    if (val && idx === 5) {
      const code = [...newOtp.slice(0, 5), val].join('');
      if (code.length === 6) doVerify(code);
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  const doVerify = async (code) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) return;
    setLoading(true); setError('');
    try {
      await verifyOTP(phone, otpCode);
      navigate('/pin-setup', { state: { name, phone, email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Try again.');
      setOtp(['', '', '', '', '', '']);
      refs[0].current?.focus();
    }
    setLoading(false);
  };

  const resend = async () => {
    if (timer > 0) return;
    try { await sendOTP(phone); setTimer(30); setError(''); } catch (err) { setError(err.response?.data?.error || 'Failed to resend OTP'); }
  };

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav">
        <div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div className="ntl">Verify OTP</div>
      </div>
      <div className="sb" style={{ padding: '20px 18px' }}>
        <div style={{ textAlign: 'center', padding: '20px 0 28px' }}>
          <div className="icon-hero" style={{ color: 'var(--accent)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Check your SMS</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>Code sent to {phone || 'your number'}</div>
        </div>
        <div className="orow" style={{ marginBottom: 18 }}>
          {otp.map((d, i) => (
            <input key={i} ref={refs[i]} className="ob" maxLength="1" type="tel" inputMode="numeric" value={d}
              onChange={e => handleInput(e.target.value, i)} onKeyDown={e => handleKeyDown(e, i)} />
          ))}
        </div>
        {error && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--red)', fontWeight: 600, marginBottom: 12 }}>{error}</div>}
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>
          Didn't receive it? <span style={{ color: timer > 0 ? 'var(--text3)' : 'var(--accent)', fontWeight: 700, cursor: timer > 0 ? 'default' : 'pointer' }} onClick={resend}>
            {timer > 0 ? `Resend (${timer}s)` : 'Resend now'}
          </span>
        </div>
        <button className="btn btn-p" onClick={() => doVerify()} disabled={loading || otp.join('').length < 6}>
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>
      </div>
    </div>
  );
}
