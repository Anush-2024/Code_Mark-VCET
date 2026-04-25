import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { getKeys } from '../services/storageService';
import { deriveKeyFromPIN, decryptPrivateKey } from '../services/cryptoService';
import { withdrawMoney } from '../services/apiService';
import Keypad from '../components/Keypad';

export default function Withdraw() {
  const navigate = useNavigate();
  const { user, confirmed_bal, locked_bal, isOnline, loadWalletState, updateBalance } = useWalletStore();
  const spendable = confirmed_bal - locked_bal;
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('Primary Bank');
  const [accountNo] = useState('xxxx' + (user?.phone || '4321').slice(-4));
  const [ifsc] = useState('PKPT0000' + (user?.userId || '123'));
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinErr, setPinErr] = useState('');
  const [processing, setProcessing] = useState(false);

  const checkWD = (val) => {
    setAmount(val);
    const amt = parseInt(val) * 100;
    if (amt < 10000) setError('Minimum withdrawal is ₹100');
    else if (amt > spendable) setError('Exceeds available balance');
    else setError('');
  };

  const initiate = () => {
    if (!isOnline) { setError('Internet required for withdrawals'); return; }
    const amt = parseInt(amount) * 100;
    if (amt < 10000 || amt > spendable) return;
    setShowPin(true);
  };

  const handlePinKey = async (key) => {
    if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 6) {
        setProcessing(true);
        try {
          // Verify PIN by decrypting private key
          const keys = await getKeys();
          const saltBytes = Uint8Array.from(atob(keys.salt), c => c.charCodeAt(0));
          const aesKey = await deriveKeyFromPIN(newPin, saltBytes);
          await decryptPrivateKey(keys.encPrivKey, keys.iv, aesKey);

          // PIN verified — call real withdrawal API
          const result = await withdrawMoney({
            amount: parseInt(amount) * 100,
            bankName,
            accountNo,
            ifsc
          });

          // Update local state from server
          if (result.wallet) {
            await updateBalance({
              confirmed_bal: result.wallet.confirmed_bal,
              locked_bal: result.wallet.locked_bal
            });
          }

          await loadWalletState();
          setShowPin(false);
          navigate('/home');
        } catch (e) {
          const msg = e.response?.data?.error || e.message || 'Withdrawal failed';
          setPinErr(msg);
          setTimeout(() => { setPin(''); setPinErr(''); }, 1500);
        }
        setProcessing(false);
      }
    }
  };

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav"><div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div><div className="ntl">Withdraw to Bank</div></div>
      <div className="sb" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'var(--bbg)', border: '1px solid rgba(116,185,255,.2)', borderRadius: 'var(--r2)', padding: 12, fontSize: 12, color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> Withdrawals require internet. Amount sent to linked bank within 30 minutes.</div>
        {!isOnline && <div style={{ background: 'var(--rbg)', border: '1px solid rgba(255,118,117,.2)', borderRadius: 'var(--r2)', padding: 12, fontSize: 12, color: 'var(--red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> You are offline. Please go online to make withdrawals.</div>}
        <div className="ig">
          <div className="il">Amount to withdraw</div>
          <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: 'var(--text2)' }}>₹</span>
          <input className="if" type="number" value={amount} onChange={e => checkWD(e.target.value)} placeholder="Minimum ₹100" style={{ paddingLeft: 32, fontSize: 20, fontWeight: 700 }} /></div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginTop: -8 }}>Available: ₹{(spendable / 100).toLocaleString('en-IN')}</div>
        {error && <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>{error}</div>}
        <div className="ig">
          <div className="il">Bank account</div>
          <select className="if" style={{ cursor: 'pointer' }} value={bankName} onChange={e => setBankName(e.target.value)}>
            <option>Primary Bank — xxxx {(user?.phone || '4321').slice(-4)}</option>
            <option>Secondary Bank — xxxx 8890</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)' }}><div style={{ fontSize: 13, color: 'var(--text2)' }}>Transfer fee</div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>Free</div></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)' }}><div style={{ fontSize: 13, color: 'var(--text2)' }}>Estimated time</div><div style={{ fontSize: 13, fontWeight: 700 }}>30 minutes</div></div>
        <button className="btn btn-p" onClick={initiate} disabled={!amount || !!error || !isOnline}>Withdraw →</button>
      </div>

      {/* PIN Modal */}
      <div className={`mover ${showPin ? 'show' : ''}`}>
        <div className="msheet">
          <div className="mhandle" />
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Confirm withdrawal</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Enter PIN to withdraw <strong>₹{amount}</strong> to {bankName}</div>
          </div>
          <div className="pdots">{[0,1,2,3,4,5].map(i => <div key={i} className={`pd ${i < pin.length ? 'on' : ''} ${pinErr ? 'err' : ''}`} />)}</div>
          <div style={{ fontSize: 12, color: 'var(--red)', height: 16, textAlign: 'center', fontWeight: 600 }}>{pinErr}</div>
          {processing && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>Processing withdrawal...</div>}
          <Keypad onKey={handlePinKey} onDelete={() => setPin(p => p.slice(0, -1))} />
        </div>
      </div>
    </div>
  );
}
