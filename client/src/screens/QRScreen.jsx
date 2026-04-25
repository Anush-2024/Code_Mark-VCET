import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { unlockFunds } from '../services/walletService';
import { useWalletStore } from '../store/walletStore';
import { deletePendingTxn } from '../services/storageService';

export default function QRScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { qrData, txnId, expiresAt, amount, recipientName } = state || {};
  const { loadWalletState } = useWalletStore();
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const left = Math.max(0, (expiresAt || now + 60) - now);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        handleCancel();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async () => {
    await unlockFunds(amount || 0);
    if (txnId) await deletePendingTxn(txnId);
    await loadWalletState();
    navigate('/home', { replace: true });
  };

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav">
        <div className="bk" onClick={handleCancel}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div className="ntl">Payment QR</div>
        <div className="nact"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></div>
      </div>
      <div className="sb" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 18px' }}>
        <div className="qbox" style={{ marginBottom: 14, boxShadow: '0 8px 40px rgba(0,0,0,.4)' }}>
          {qrData ? <QRCodeSVG value={qrData} size={192} level="M" fgColor="#1a0050" bgColor="#ffffff" /> : <div>No QR</div>}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, marginBottom: 3 }}>Paying to <span style={{ color: 'var(--text)' }}>{recipientName || '—'}</span></div>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em' }}>₹{((amount || 0) / 100).toLocaleString('en-IN')}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--fm)', marginTop: 4 }}>TXN·{(txnId || '—').slice(0, 8)}</div>
        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginTop: 16 }}>
          <div style={{ flex: 1, height: 5, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: timeLeft < 10 ? 'var(--red)' : 'var(--accent)', borderRadius: 3, width: `${(timeLeft / 60) * 100}%`, transition: 'width 1s linear' }} />
          </div>
          <div style={{ fontSize: 13, fontFamily: 'var(--fm)', fontWeight: 700, minWidth: 32, textAlign: 'right', color: timeLeft < 10 ? 'var(--red)' : 'var(--text)' }}>{timeLeft}s</div>
        </div>
        <div style={{ background: 'var(--abg)', border: '1px solid rgba(253,203,110,.2)', borderRadius: 'var(--r2)', padding: '11px 13px', marginTop: 14, fontSize: 12, color: 'var(--amber)', fontWeight: 600, lineHeight: 1.6, width: '100%' }}>
          ₹{((amount || 0) / 100).toLocaleString('en-IN')} locked from your balance. Unlocks automatically if QR expires without being scanned.
        </div>
        <div style={{ display: 'flex', gap: 9, width: '100%', marginTop: 14 }}>
          <button className="btn btn-s" style={{ flex: 1 }}>Share QR</button>
          <button className="btn btn-d" style={{ flex: 1 }} onClick={handleCancel}>Cancel & Unlock</button>
        </div>
      </div>
    </div>
  );
}
