import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';

export default function Splash() {
  const navigate = useNavigate();
  const { isLoggedIn } = useWalletStore();

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: 76, height: 76, background: 'var(--accent)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: '0 12px 40px rgba(108,92,231,.5)' }}>
          <svg width="40" height="40" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 8 }}>PocketPay</div>
        <div style={{ fontSize: 15, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6, maxWidth: 280 }}>Pay anyone, anywhere — even without internet. Secured by cryptography.</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 30 }}>
          <div style={{ width: 24, height: 5, borderRadius: 3, background: 'var(--accent)' }} />
          <div style={{ width: 6, height: 5, borderRadius: 3, background: 'var(--border2)' }} />
          <div style={{ width: 6, height: 5, borderRadius: 3, background: 'var(--border2)' }} />
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>Works offline · Ed25519 secured · Made in India</div>
      </div>
      <div style={{ padding: '18px 18px 36px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-p" onClick={() => navigate('/register')}>Create account</button>
        <button className="btn btn-s" onClick={() => navigate('/login')}>Sign in to existing wallet</button>
      </div>
    </div>
  );
}
