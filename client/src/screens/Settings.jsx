import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { wipeKeys, getKeys, getUserProfile } from '../services/storageService';
import { clearToken } from '../services/apiService';
import { QRCodeSVG } from 'qrcode.react';


export default function Settings() {
  const navigate = useNavigate();
  const { user, theme, toggleTheme, logout } = useWalletStore();
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferData, setTransferData] = useState('');
  const initial = (user?.name || 'U')[0].toUpperCase();

  const doLogout = () => { clearToken(); logout(); navigate('/', { replace: true }); };
  const doDelete = async () => { if (confirm('Delete wallet and wipe all keys? This cannot be undone.')) { clearToken(); await wipeKeys(); logout(); navigate('/', { replace: true }); } };

  const prepareTransfer = async () => {
    const keys = await getKeys();
    const profile = await getUserProfile();
    const data = JSON.stringify({
      t: 'pp_transfer',
      k: { pub: keys.pubKey, enc: keys.encPrivKey, iv: keys.iv, salt: keys.salt },
      p: { name: profile.name, phone: profile.phone, userId: profile.userId }
    });
    setTransferData(data);
    setShowTransfer(true);
  };

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav"><div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div><div className="ntl">Settings</div></div>
      <div className="sb" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0 20px' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>{initial}</div>
          <div><div style={{ fontSize: 16, fontWeight: 800 }}>{user?.name || 'User'}</div><div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}>+91 {user?.phone || '98765 43210'} · KYC <svg width="12" height="12" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div></div>
        </div>
        {/* Security */}
        <div className="sl">Security</div>
        {[
          { icon: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>, bg: 'var(--acbg)', stroke: 'var(--accent2)', name: 'Change PIN', desc: 'Update your 6-digit unlock code', arrow: true },
          { icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>, bg: 'var(--abg)', stroke: 'var(--amber)', name: 'Recovery phrase', desc: 'View your 12-word backup', arrow: true, onClick: () => navigate('/recovery-phrase', { state: { name: user?.name, phone: user?.phone, email: user?.email, pin: '000000', viewOnly: true } }) },
          { icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>, bg: 'var(--gbg)', stroke: 'var(--green)', name: 'Transfer to Device', desc: 'Login on phone using QR', arrow: true, onClick: prepareTransfer },
          { icon: <><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>, bg: 'var(--bbg)', stroke: 'var(--blue)', name: 'Device management', desc: '1 device registered', arrow: true },
        ].map((s, i) => (
          <div key={i} className="si" onClick={s.onClick}>
            <div className="sii" style={{ background: s.bg }}><svg style={{ stroke: s.stroke }} viewBox="0 0 24 24">{s.icon}</svg></div>
            <div className="sin"><div className="sin-n">{s.name}</div><div className="sin-d">{s.desc}</div></div>
            {s.arrow && <svg width="14" height="14" fill="none" stroke="var(--text3)" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>}
            {s.toggle && <div className="tgl on" onClick={e => { e.stopPropagation(); e.currentTarget.classList.toggle('on'); }}><div className="tglb" /></div>}
          </div>
        ))}
        {/* Wallet */}
        <div className="sl" style={{ marginTop: 10 }}>Wallet</div>
        {[
          { icon: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></>, bg: 'var(--abg)', stroke: 'var(--amber)', name: 'Offline limits', desc: '₹500/txn · ₹2,000/day' },
          { icon: <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></>, bg: 'var(--acbg)', stroke: 'var(--accent2)', name: 'Merchant mode', desc: 'Accept at your store', toggle: true },
          { icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>, bg: 'var(--gbg)', stroke: 'var(--green)', name: 'Export transactions', desc: 'Download as CSV' },
        ].map((s, i) => (
          <div key={i} className="si">
            <div className="sii" style={{ background: s.bg }}><svg style={{ stroke: s.stroke }} viewBox="0 0 24 24">{s.icon}</svg></div>
            <div className="sin"><div className="sin-n">{s.name}</div><div className="sin-d">{s.desc}</div></div>
            {s.toggle ? <div className="tgl" onClick={e => { e.stopPropagation(); e.currentTarget.classList.toggle('on'); }}><div className="tglb" /></div> : <svg width="14" height="14" fill="none" stroke="var(--text3)" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>}
          </div>
        ))}
        {/* Prefs */}
        <div className="sl" style={{ marginTop: 10 }}>Preferences</div>
        <div className="si" onClick={toggleTheme}>
          <div className="sii" style={{ background: 'var(--surface2)' }}><svg style={{ stroke: 'var(--text2)' }} viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg></div>
          <div className="sin"><div className="sin-n">Appearance</div><div className="sin-d">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</div></div>
          <div className={`tgl ${theme === 'dark' ? 'on' : ''}`}><div className="tglb" /></div>
        </div>
        <div className="si">
          <div className="sii" style={{ background: 'var(--surface2)' }}><svg style={{ stroke: 'var(--text2)' }} viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>
          <div className="sin"><div className="sin-n">Push notifications</div><div className="sin-d">Sync alerts, payment updates</div></div>
          <div className="tgl on" onClick={e => { e.stopPropagation(); e.currentTarget.classList.toggle('on'); }}><div className="tglb" /></div>
        </div>
        {/* Danger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, paddingBottom: 28 }}>
          <button className="btn btn-s" onClick={doLogout}>Log out</button>
          <button className="btn btn-d" onClick={doDelete}>Delete wallet & wipe keys</button>
        </div>
      </div>

      {/* Transfer Modal */}
      <div className={`mover ${showTransfer ? 'show' : ''}`}>
        <div className="msheet" style={{ minHeight: '60vh' }}>
          <div className="mhandle" onClick={() => setShowTransfer(false)} />
          <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Link New Device</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
              Scan this QR with the <strong>PocketPay app</strong> on your phone's login screen to sync your account instantly.
            </div>
            
            <div className="qbox" style={{ background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,.15)' }}>
              <QRCodeSVG value={transferData} size={200} level="M" />
            </div>

            <div style={{ marginTop: 24, padding: 14, background: 'var(--abg)', borderRadius: 12, border: '1px solid rgba(253,203,110,.3)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                 <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> SECURITY WARNING
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4 }}>
                This QR contains your encrypted private key. Only share this with your own trusted devices. Never send a screenshot of this to anyone.
              </div>
            </div>

            <button className="btn btn-p" style={{ marginTop: 24 }} onClick={() => setShowTransfer(false)}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
