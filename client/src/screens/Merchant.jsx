import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { getAllTxns } from '../services/storageService';
import { QRCodeSVG } from 'qrcode.react';

const fmt = (p) => '₹' + (p / 100).toLocaleString('en-IN');

export default function Merchant() {
  const navigate = useNavigate();
  const { user } = useWalletStore();
  const [txns, setTxns] = useState([]);

  useEffect(() => { loadTxns(); }, []);
  const loadTxns = async () => {
    const all = await getAllTxns();
    setTxns(all.filter(t => t.type === 'received').sort((a, b) => b.created_at - a.created_at));
  };

  const todayStart = new Date().setHours(0, 0, 0, 0) / 1000;
  const todaysTxns = txns.filter(t => t.created_at >= todayStart);
  const todaysCollections = todaysTxns.reduce((sum, t) => sum + t.amount, 0);
  const unconfirmedTotal = txns.filter(t => t.status === 'unconfirmed_received' || t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

  const qrPayload = JSON.stringify({ userId: user?.userId, pubKey: user?.pubKey, name: user?.name });

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav"><div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div><div className="ntl">Merchant Mode</div></div>
      <div className="sb" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ background: 'var(--gbg)', border: '1px solid rgba(0,184,148,.2)', borderRadius: 'var(--r2)', padding: 13, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{fmt(todaysCollections)}</div><div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginTop: 2 }}>TODAY'S COLLECTIONS</div></div>
          <div style={{ background: 'var(--abg)', border: '1px solid rgba(253,203,110,.2)', borderRadius: 'var(--r2)', padding: 13, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: 'var(--amber)' }}>{fmt(unconfirmedTotal)}</div><div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginTop: 2 }}>UNCONFIRMED</div></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent2)', background: 'var(--acbg)', padding: '4px 12px', borderRadius: 20, border: '1px solid var(--acbd)', marginBottom: 14, letterSpacing: '.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            STATIC QR — NO INTERNET NEEDED
          </div>
          <div className="qbox" style={{ boxShadow: 'var(--shadow)' }}>
            <QRCodeSVG value={qrPayload} size={192} level="M" fgColor="#1a0050" imageSettings={{ src: '', excavate: true }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, marginTop: 12 }}>{user?.name || 'Merchant Store'}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--fm)', marginTop: 3 }}>{user?.walletId || 'Loading...'}</div>
          <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
            <button className="btn btn-s btn-sm">Print</button>
            <button className="btn btn-s btn-sm">Download</button>
            <button className="btn btn-s btn-sm">Share</button>
          </div>
        </div>
        <div className="sl" style={{ marginBottom: 4 }}>Recent payments</div>
        {txns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 28, color: 'var(--text3)', fontSize: 13 }}>No collections yet today.</div>
        ) : txns.slice(0, 10).map(tx => (
          <div key={tx.id} className="ti">
            <div className="tic" style={{ background: tx.status === 'confirmed' ? 'var(--gbg)' : 'var(--abg)' }}>
              <svg width="20" height="20" fill="none" stroke={tx.status === 'confirmed' ? 'var(--green)' : 'var(--amber)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div className="tin"><div className="tin-n">{tx.recipientName || 'Customer'}</div><div className="tin-m">{new Date(tx.created_at * 1000).toLocaleTimeString()}</div></div>
            <div className="tia"><div className="tia-a" style={{ color: 'var(--green)' }}>+{fmt(tx.amount)}</div><div className={`tia-s badge ${tx.status === 'confirmed' ? 'bg' : 'ba'}`} style={{ display: 'inline', padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{tx.status}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
