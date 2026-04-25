import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTxns } from '../services/storageService';

const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN');

export default function History() {
  const navigate = useNavigate();
  const [txns, setTxns] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadTxns(); }, []);
  const loadTxns = async () => { const all = await getAllTxns(); setTxns(all.sort((a, b) => b.created_at - a.created_at)); };

  const filtered = filter === 'all' ? txns : txns.filter(t => {
    if (filter === 'sent') return t.type === 'sent';
    if (filter === 'received') return t.type === 'received';
    if (filter === 'pending') return t.status === 'pending' || t.status === 'unconfirmed_received';
    if (filter === 'failed') return t.status === 'failed';
    return true;
  });

  const filters = [
    { id: 'all', label: 'All' }, { id: 'sent', label: 'Sent' }, { id: 'received', label: 'Received' },
    { id: 'pending', label: 'Pending' }, { id: 'failed', label: 'Failed' }
  ];

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav">
        <div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div className="ntl">Transactions</div>
        <div className="nact"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
      </div>
      <div className="sb">
        <div className="seg" style={{ padding: '10px 18px' }}>
          {filters.map(f => <div key={f.id} className={`st ${filter === f.id ? 'on' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</div>)}
        </div>
        <div style={{ padding: '0 18px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No transactions found</div>
          ) : filtered.map(tx => (
            <div key={tx.id} className="ti" onClick={() => navigate(`/history/${tx.id}`)}>
              <div className="tic" style={{ background: tx.type === 'sent' ? 'var(--rbg)' : 'var(--gbg)' }}>
                {tx.type === 'sent' ? (
                  <svg width="16" height="16" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>
                )}
              </div>
              <div className="tin">
                <div className="tin-n">{tx.recipientName || (tx.type === 'received' ? 'Received' : 'Sent')}</div>
                <div className="tin-m">{new Date(tx.created_at * 1000).toLocaleDateString()} · {tx.status}</div>
              </div>
              <div className="tia">
                <div className="tia-a" style={{ color: tx.type === 'sent' ? 'var(--red)' : 'var(--green)' }}>{tx.type === 'sent' ? '-' : '+'}{fmt(tx.amount)}</div>
                <div className={`tia-s badge ${tx.status === 'confirmed' ? 'bg' : tx.status === 'failed' ? 'br' : 'ba'}`} style={{ display: 'inline', padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{tx.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
