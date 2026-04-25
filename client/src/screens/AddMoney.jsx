import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { addMoney as addMoneyAPI } from '../services/apiService';
import { addTopUp } from '../services/walletService';


export default function AddMoney() {
  const navigate = useNavigate();
  const { confirmed_bal, isOnline, loadWalletState } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doAdd = async () => {
    const amt = parseInt(amount) * 100;
    if (!amt || amt <= 0) return;
    setLoading(true);
    setError('');

    try {
      if (isOnline) {
        // Add via real API
        const result = await addMoneyAPI(amt);
        // Update local state with server confirmed balance
        if (result.wallet) {
          const { updateBalance } = useWalletStore.getState();
          await updateBalance({
            confirmed_bal: result.wallet.confirmed_bal,
            locked_bal: result.wallet.locked_bal
          });
        }
      } else {
        // Offline: add locally only (will reconcile later)
        await addTopUp(amt);
      }
      await loadWalletState();
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add money');
    }
    setLoading(false);
  };

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav"><div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div><div className="ntl">Add Money</div></div>
      <div className="sb" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="ig">
          <div className="il">Amount</div>
          <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: 'var(--text2)' }}>₹</span>
          <input className="if" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ paddingLeft: 32, fontSize: 20, fontWeight: 700 }} /></div>
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {[500, 1000, 2000, 5000].map(v => <div key={v} style={{ padding: '7px 14px', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border2)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }} onClick={() => setAmount(String(v))}>₹{v.toLocaleString()}</div>)}
        </div>
        {error && <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, padding: '8px 12px', background: 'var(--rbg)', borderRadius: 'var(--r3)', border: '1px solid rgba(255,118,117,.2)' }}>{error}</div>}
        <div className="sl" style={{ marginBottom: 0 }}>Payment method</div>
        {[
          { icon: <svg width="20" height="20" fill="none" stroke="var(--accent2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, name: 'UPI Transfer', desc: 'Instant · No charges', bg: 'var(--acbg)' },
          { icon: <svg width="20" height="20" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/></svg>, name: 'Net Banking', desc: 'NEFT/IMPS · 1-2 hours', bg: 'var(--bbg)' },
          { icon: <svg width="20" height="20" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, name: 'Debit Card', desc: 'Visa / RuPay / Mastercard', bg: 'var(--gbg)' },
        ].map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 14, cursor: 'pointer' }} onClick={doAdd}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.icon}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div><div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{m.desc}</div></div>
            <svg width="14" height="14" fill="none" stroke="var(--text3)" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
        <div className="card" style={{ padding: 14 }}>
          <div className="sl" style={{ marginBottom: 8 }}>Wallet limits</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}><span style={{ color: 'var(--text2)' }}>Balance</span><span style={{ fontWeight: 700 }}>₹{(confirmed_bal / 100).toLocaleString()} / ₹10,000</span></div>
          <div className="limit-bar"><div className="limit-fill" style={{ width: `${Math.min(100, (confirmed_bal / 1000000) * 100)}%` }} /></div>
        </div>
      </div>
    </div>
  );
}
