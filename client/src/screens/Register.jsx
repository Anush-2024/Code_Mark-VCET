import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP } from '../services/apiService';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doRegister = async () => {
    if (!name.trim() || !phone.trim() || phone.length < 10) return;
    setLoading(true); setError('');
    try {
      const formattedPhone = '+91' + phone.replace(/\s/g, '').slice(-10);
      await sendOTP(formattedPhone);
      navigate('/otp', { state: { name, phone: formattedPhone, email } });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav">
        <div className="bk" onClick={() => navigate('/')}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div className="ntl">Create Account</div>
      </div>
      <div className="sb" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="ig"><div className="il">Full name</div><input className="if" value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Riya Sharma"/></div>
        <div className="ig"><div className="il">Mobile number</div>
          <div className="ph-row"><div className="cc">+91</div><input className="if" style={{ flex: 1 }} value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="98765 43210" maxLength="10"/></div>
        </div>
        <div className="ig"><div className="il">Email (optional)</div><input className="if" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="riya@example.com"/></div>
        {error && <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, padding: '8px 12px', background: 'var(--rbg)', borderRadius: 'var(--r3)', border: '1px solid rgba(255,118,117,.2)' }}>{error}</div>}
        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7, padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:2}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>A real OTP will be sent to your phone via Twilio. Only verified numbers work on trial accounts.</span>
        </div>
        <button className="btn btn-p" onClick={doRegister} disabled={loading || !name.trim() || phone.length < 10}>
          {loading ? 'Sending OTP...' : 'Continue'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)' }}>Already have an account? <span style={{ color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/login')}>Sign in</span></div>
      </div>
    </div>
  );
}
