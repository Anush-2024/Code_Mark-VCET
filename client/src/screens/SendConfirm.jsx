import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { getKeys } from '../services/storageService';
import { deriveKeyFromPIN, decryptPrivateKey } from '../services/cryptoService';
import { createSendTransaction } from '../services/transactionService';
import Keypad from '../components/Keypad';

export default function SendConfirm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { amount, recipient } = state || { amount: 0, recipient: { name: '—' } };
  const { isOnline, loadWalletState } = useWalletStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleKey = async (key) => {
    if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 6) {
        try {
          const keys = await getKeys();
          const saltBytes = Uint8Array.from(atob(keys.salt), c => c.charCodeAt(0));
          const aesKey = await deriveKeyFromPIN(newPin, saltBytes);
          const privateKey = await decryptPrivateKey(keys.encPrivKey, keys.iv, aesKey);

          const result = await createSendTransaction({
            amount,
            recipientId: recipient.id,
            recipientName: recipient.name,
            privateKey,
            senderPubKey: keys.pubKey
          });

          await loadWalletState();
          navigate('/send/qr', { state: { ...result, amount, recipientName: recipient.name }, replace: true });
        } catch (e) {
          if (e.message === 'INSUFFICIENT_BALANCE') setError('Insufficient spendable balance');
          else if (e.message === 'EXCEEDS_OFFLINE_TXN_LIMIT') setError('Exceeds offline limit (₹500)');
          else if (e.message === 'EXCEEDS_DAILY_LIMIT') setError('Daily offline limit reached (₹2,000)');
          else setError('Wrong PIN or error occurred');
          setTimeout(() => { setPin(''); setError(''); }, 1200);
        }
      }
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav">
        <div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div className="ntl">Confirm Payment</div>
      </div>
      <div className="sb" style={{ padding: 18 }}>
        <div className="card" style={{ marginBottom: 14 }}>
          {[
            ['To', recipient.name],
            ['Amount', '₹' + (amount / 100).toLocaleString('en-IN'), { fontSize: 20, fontWeight: 800, color: 'var(--accent)' }],
            ['Fee', '₹0.00', { color: 'var(--green)' }],
            ['Mode', null, null, true],
            ['QR expires', '60 seconds'],
          ].map(([k, v, s, isBadge], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{k}</div>
              {isBadge ? <span className="badge ba" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> {isOnline ? 'Online' : 'Offline'}</span> : <div style={{ fontSize: 13, fontWeight: 700, ...s }}>{v}</div>}
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--abg)', border: '1px solid rgba(253,203,110,.2)', borderRadius: 'var(--r2)', padding: 12, marginBottom: 14, fontSize: 12, color: 'var(--amber)', fontWeight: 600, lineHeight: 1.7, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Offline payment: ₹{(amount / 100).toLocaleString('en-IN')} will be locked from your balance until both devices sync online.
        </div>
        <div className="sl">Confirm with PIN</div>
        <div className="pdots">
          {[0,1,2,3,4,5].map(i => <div key={i} className={`pd ${i < pin.length ? 'on' : ''} ${error ? 'err' : ''}`} />)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--red)', height: 16, textAlign: 'center', fontWeight: 600 }}>{error}</div>
        <Keypad onKey={handleKey} onDelete={handleDelete} />
      </div>
    </div>
  );
}
