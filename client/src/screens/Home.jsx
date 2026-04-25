import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { getAllTxns } from '../services/storageService';

const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN');

const IconArrowUpRight = () => <svg viewBox="0 0 24 24" style={{width:18,height:18,stroke:'var(--red)',strokeWidth:2,fill:'none',strokeLinecap:'round',strokeLinejoin:'round'}}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>;
const IconArrowDownLeft = () => <svg viewBox="0 0 24 24" style={{width:18,height:18,stroke:'var(--green)',strokeWidth:2,fill:'none',strokeLinecap:'round',strokeLinejoin:'round'}}><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>;

export default function Home() {
  const navigate = useNavigate();
  const { user, confirmed_bal, locked_bal, unconfirmed_received, isOnline, loadWalletState } = useWalletStore();
  const [txns, setTxns] = useState([]);
  const [stats, setStats] = useState({ sent: 0, received: 0, spendTotal: 0, bars: [5,5,5,5,5,5,5] });

  useEffect(() => { loadWalletState(); loadTxns(); }, []);
  const loadTxns = async () => { 
    const all = await getAllTxns(); 
    setTxns([...all].sort((a, b) => b.created_at - a.created_at).slice(0, 5)); 
    
    // Calculate stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime() / 1000;
    
    let sentMonth = 0;
    let recMonth = 0;
    const dailySpend = [0,0,0,0,0,0,0];
    
    all.forEach(t => {
      if (t.created_at >= startOfMonth) {
        if (t.type === 'sent') sentMonth += t.amount;
        if (t.type === 'received') recMonth += t.amount;
      }
      if (t.type === 'sent') {
         const daysAgo = Math.floor((todayEnd - t.created_at) / 86400);
         if (daysAgo >= 0 && daysAgo < 7) {
            dailySpend[6 - daysAgo] += t.amount;
         }
      }
    });

    const maxSpend = Math.max(...dailySpend, 100); 
    const bars = dailySpend.map(s => Math.max(4, Math.round((s / maxSpend) * 100)));
    setStats({ sent: sentMonth, received: recMonth, spendTotal: dailySpend.reduce((a,b)=>a+b,0), bars });
  };

  const spendable = confirmed_bal - locked_bal;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,';
  const initial = (user?.name || 'U')[0].toUpperCase();
  
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayLabels = Array.from({length: 7}).map((_, i) => {
    if (i === 6) return 'Today';
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return dayNames[d.getDay()];
  });

  return (
    <div className="scr">
      <div className="sb" style={{ padding: '24px 28px' }}>
        {/* Offline banner */}
        {!isOnline && (
          <div style={{ background: 'var(--abg)', border: '1px solid rgba(253,203,110,.15)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--amber)', fontWeight: 600, borderRadius: 'var(--r2)', marginBottom: 16 }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Offline mode — transactions limited to ₹500 per transfer
          </div>
        )}
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div><div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>{greeting}</div><div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.01em' }}>{user?.name || 'User'}</div></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="nact" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <div style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, background: 'var(--red)', borderRadius: '50%', border: '1.5px solid var(--bg2)' }} />
            </div>
            <div onClick={() => navigate('/profile')} style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', cursor: 'pointer' }}>{initial}</div>
          </div>
        </div>
        {/* Balance card */}
        <div className="bcard">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(255,255,255,.65)', marginBottom: 5 }}>TOTAL BALANCE</div>
          <div style={{ fontSize: 38, fontWeight: 300, color: '#fff', letterSpacing: '-.03em', marginBottom: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>₹</span><span>{(confirmed_bal / 100).toLocaleString('en-IN')}</span><span style={{ fontSize: 18, fontWeight: 600 }}>.00</span>
          </div>
          <div style={{ position: 'absolute', top: 22, right: 22, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? 'var(--green)' : 'var(--amber)', boxShadow: `0 0 8px ${isOnline ? 'var(--green)' : 'var(--amber)'}` }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', fontWeight: 700 }}>{isOnline ? 'Online' : 'Offline'}</div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
            <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>SPENDABLE</div><div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{fmt(spendable)}</div></div>
            <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>LOCKED</div><div style={{ fontSize: 14, color: 'rgba(253,203,110,.9)', fontWeight: 700 }}>{fmt(locked_bal)}</div></div>
            <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>UNCONFIRMED IN</div><div style={{ fontSize: 14, color: 'rgba(0,184,148,.9)', fontWeight: 700 }}>{fmt(unconfirmed_received || 0)}</div></div>
          </div>
        </div>
        {/* Quick actions */}
        <div className="agrid">
          <div className="ab" onClick={() => navigate('/send')}><div className="ai t"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div><div className="al">Send</div></div>
          <div className="ab" onClick={() => navigate('/receive')}><div className="ai t"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div><div className="al">Receive</div></div>
          <div className="ab" onClick={() => navigate('/add-money')}><div className="ai"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div><div className="al">Add</div></div>
          <div className="ab" onClick={() => navigate('/withdraw')}><div className="ai"><svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div><div className="al">Withdraw</div></div>
          <div className="ab" onClick={() => navigate('/history')}><div className="ai"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div className="al">History</div></div>
        </div>
        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div className="card" style={{ padding: '15px 16px' }}><div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 3 }}>SENT THIS MONTH</div><div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)' }}>{fmt(stats.sent)}</div></div>
          <div className="card" style={{ padding: '15px 16px' }}><div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 3 }}>RECEIVED</div><div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{fmt(stats.received)}</div></div>
        </div>
        {/* Spend chart */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>SPENDING — LAST 7 DAYS</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(stats.spendTotal)}</div>
          </div>
          <div className="mbars">
            {stats.bars.map((h, i) => <div key={i} className="mbar" style={{ height: `${h}%`, background: i === 6 ? 'var(--accent)' : 'var(--surface2)' }} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            {dayLabels.map((d, i) => <span key={i} style={{ fontSize: 10, color: i === 6 ? 'var(--accent2)' : 'var(--text3)', fontWeight: i === 6 ? 700 : 600 }}>{d}</span>)}
          </div>
        </div>
        {/* Recent txns */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="sl" style={{ marginBottom: 0 }}>Recent transactions</div>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/history')}>View all</span>
        </div>
        {txns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 28, color: 'var(--text3)', fontSize: 13 }}>No transactions yet. Send or receive to get started.</div>
        ) : txns.map(tx => (
          <div key={tx.id} className="ti" onClick={() => navigate(`/history/${tx.id}`)}>
            <div className="tic" style={{ background: tx.type === 'sent' ? 'var(--rbg)' : 'var(--gbg)' }}>{tx.type === 'sent' ? <IconArrowUpRight /> : <IconArrowDownLeft />}</div>
            <div className="tin"><div className="tin-n">{tx.recipientName || 'Payment'}</div><div className="tin-m">{new Date(tx.created_at * 1000).toLocaleTimeString()} · {tx.status}</div></div>
            <div className="tia"><div className="tia-a" style={{ color: tx.type === 'sent' ? 'var(--red)' : 'var(--green)' }}>{tx.type === 'sent' ? '-' : '+'}{fmt(tx.amount)}</div></div>
          </div>
        ))}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
