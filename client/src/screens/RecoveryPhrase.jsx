import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateKeypair, deriveKeyFromPIN, encryptPrivateKey } from '../services/cryptoService';
import { saveKeys, saveWalletState, saveUserProfile, wipeKeys } from '../services/storageService';
import { registerUser } from '../services/apiService';
import { useWalletStore } from '../store/walletStore';

const BIP39_WORDS = [
  'abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse',
  'access','accident','account','accuse','achieve','acid','acoustic','acquire','across','act',
  'action','actor','actress','actual','adapt','add','addict','address','adjust','admit',
  'adult','advance','advice','aerobic','affair','afford','afraid','again','age','agent',
  'agree','ahead','aim','air','airport','aisle','alarm','album','alcohol','alert',
  'alien','all','alley','allow','almost','alone','alpha','already','also','alter',
  'always','amateur','amazing','among','amount','amused','analyst','anchor','ancient','anger',
  'angle','angry','animal','ankle','announce','annual','another','answer','antenna','antique',
  'anxiety','any','apart','apology','appear','apple','approve','april','arch','arctic',
  'area','arena','argue','arm','armed','armor','army','around','arrange','arrest',
  'arrive','arrow','art','artefact','artist','artwork','ask','aspect','assault','asset',
  'assist','assume','asthma','athlete','atom','attack','attend','attitude','attract','auction'
];

function generatePhrase() {
  const words = [];
  for (let i = 0; i < 12; i++) {
    const idx = crypto.getRandomValues(new Uint8Array(1))[0] % BIP39_WORDS.length;
    words.push(BIP39_WORDS[idx]);
  }
  return words;
}

export default function RecoveryPhrase() {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, phone, email, pin } = location.state || {};
  const { setUser, loadWalletState } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const phrase = useMemo(() => generatePhrase(), []);

  const finishRegister = async () => {
    setLoading(true); setError('');
    try {
      const { pubKey, privKeyRaw } = await generateKeypair();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const aesKey = await deriveKeyFromPIN(pin, salt);
      const { encryptedKey, iv } = await encryptPrivateKey(privKeyRaw, aesKey);
      
      // Wipe any existing data to ensure clean slate for new user
      await wipeKeys();
      
      const saltB64 = btoa(String.fromCharCode(...salt));
      await saveKeys({ pubKey, encryptedKey, iv, salt: saltB64 });
      
      const regResult = await registerUser({ 
        phone, 
        name, 
        email, 
        pubKey,
        backup: { enc: encryptedKey, iv, salt: saltB64 } 
      });
      await saveWalletState({ confirmed_bal: 0, locked_bal: 0, unconfirmed_received: 0, nonce: 0, daily_spent: 0, daily_date: '' });
      const walletId = regResult.walletId || ('PP·' + (name || 'user').toLowerCase().split(' ')[0] + '·' + pubKey.slice(0, 8));
      await setUser({ name, phone, email, walletId, pubKey, userId: regResult.userId, createdAt: Date.now() });
      await loadWalletState();
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.error || err.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav">
        <div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div className="ntl">Recovery Phrase</div>
      </div>
      <div className="sb" style={{ padding: '16px 18px' }}>
        <div style={{ background: 'var(--abg)', border: '1px solid rgba(253,203,110,.2)', borderRadius: 'var(--r2)', padding: 13, marginBottom: 18, fontSize: 12, color: 'var(--amber)', lineHeight: 1.7, fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:1}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Write these 12 words in order. Anyone with this phrase can access your wallet. Keep them offline and secret.</span>
        </div>
        <div className="pgrid" style={{ marginBottom: 18 }}>
          {phrase.map((w, i) => (<div key={i} className="pw"><div className="pn">{i + 1}</div><div className="pt">{w}</div></div>))}
        </div>
        {error && <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, padding: '8px 12px', background: 'var(--rbg)', borderRadius: 'var(--r3)', border: '1px solid rgba(255,118,117,.2)', marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button className="btn btn-s btn-sm" onClick={() => navigator.clipboard?.writeText(phrase.join(' '))}>Copy words</button>
        </div>
        <button className="btn btn-p" onClick={finishRegister} disabled={loading}>
          {loading ? 'Creating wallet...' : "I've saved my phrase"}
        </button>
      </div>
    </div>
  );
}
