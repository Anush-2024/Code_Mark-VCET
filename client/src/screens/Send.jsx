import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { getAllTxns } from '../services/storageService';



export default function Send() {
  const navigate = useNavigate();
  const { confirmed_bal, locked_bal, isOnline } = useWalletStore();
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [selected, setSelected] = useState(null);
  const [limitWarn, setLimitWarn] = useState('');
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    loadRecents();
  }, []);

  const loadRecents = async () => {
    const all = await getAllTxns();
    // Extract unique recent recipients
    const unique = [];
    const seen = new Set();
    all.filter(t => t.type === 'sent' && t.recipientName).forEach(t => {
      if (!seen.has(t.recipientName)) {
        seen.add(t.recipientName);
        unique.push({ name: t.recipientName, id: t.to_user_id || t.toUserId, phone: 'PocketPay Wallet' });
      }
    });
    setRecents(unique.slice(0, 5));
  };

  const spendable = confirmed_bal - locked_bal;
  const filtered = recents.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const checkAmt = (val) => {
    setAmount(val);
    const amt = parseInt(val) * 100;
    if (amt > spendable) setLimitWarn('Insufficient spendable balance');
    else if (!isOnline && amt > 50000) setLimitWarn('Offline limit is ₹500 per transaction');
    else setLimitWarn('');
  };

  const proceed = () => {
    const amt = parseInt(amount) * 100;
    if (!amount || amt <= 0 || amt > spendable) return;
    if (!isOnline && amt > 50000) return;
    navigate('/send/confirm', { state: { amount: amt, recipient: selected || { name: 'Wallet ID', id: 'unknown' } } });
  };

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav">
        <div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div className="ntl">Send Money</div>
      </div>
      <div className="sb">
        <div style={{ padding: '10px 18px 8px' }}>
          <div style={{ position: 'relative' }}>
            <input className="if" type="text" placeholder="Search name, phone or wallet ID" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ padding: '4px 18px 8px' }}>
          <div className="sl">Contacts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(c => (
              <div key={c.id} className="ti" style={{ borderBottom: 'none', background: selected?.id === c.id ? 'var(--acbg)' : 'transparent', borderRadius: 'var(--r2)', padding: '10px 12px' }} onClick={() => setSelected(c)}>
                <div className="tic" style={{ background: 'var(--acbg)' }}>{c.name[0]}</div>
                <div className="tin"><div className="tin-n">{c.name}</div><div className="tin-m">{c.phone}</div></div>
                {selected?.id === c.id && <span className="badge bp">Selected</span>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '4px 18px 8px' }}><div className="sl">Enter amount</div></div>
        <div style={{ textAlign: 'center', padding: '10px 18px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <div style={{ fontSize: 30, color: 'var(--text3)', fontWeight: 700 }}>₹</div>
            <input type="number" value={amount} onChange={e => checkAmt(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 48, fontWeight: 300, color: 'var(--text)', fontFamily: 'var(--f)', width: 200, textAlign: 'center', letterSpacing: '-.02em' }} placeholder="0" />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, fontWeight: 600 }}>Spendable: ₹{(spendable / 100).toLocaleString('en-IN')}</div>
        </div>
        {limitWarn && (
          <div style={{ margin: '0 18px 10px', background: 'var(--abg)', border: '1px solid rgba(253,203,110,.2)', borderRadius: 'var(--r2)', padding: '9px 13px', fontSize: 12, color: 'var(--amber)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> {limitWarn}</div>
        )}
        <div style={{ padding: '0 18px 8px', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {[50, 100, 200, 500].map(v => (
            <div key={v} style={{ padding: '7px 14px', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border2)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }} onClick={() => checkAmt(String(v))}>₹{v}</div>
          ))}
        </div>
        <div style={{ padding: '10px 18px 24px' }}>
          <button className="btn btn-p" onClick={proceed} disabled={!amount || limitWarn}>Review Payment →</button>
        </div>
      </div>
    </div>
  );
}
