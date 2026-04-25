import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { runSync } from '../services/syncService';
import { hasToken } from '../services/apiService';


export default function SyncScreen() {
  const navigate = useNavigate();
  const { isOnline, loadWalletState, updateBalance } = useWalletStore();
  const [syncing, setSyncing] = useState(false);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState(localStorage.getItem('pp_last_sync'));

  const startSync = async () => {
    if (!isOnline) return;
    if (!hasToken()) { setError('Not logged in — please re-authenticate'); return; }

    setSyncing(true); setDone(false); setProgress(0); setError('');
    const interval = setInterval(() => setProgress(p => Math.min(p + 12, 90)), 300);

    try {
      const result = await runSync();
      clearInterval(interval);
      setProgress(100);
      setResults(result.results || []);

      // Update local balance from server if available
      if (result.serverWallet) {
        await updateBalance({
          confirmed_bal: result.serverWallet.confirmed_bal,
          locked_bal: result.serverWallet.locked_bal
        });
      }
      await loadWalletState();

      const now = new Date().toLocaleString();
      localStorage.setItem('pp_last_sync', now);
      setLastSync(now);

      setTimeout(() => { setSyncing(false); setDone(true); }, 500);
    } catch (e) {
      clearInterval(interval);
      setSyncing(false);
      setError(e.response?.data?.error || e.message || 'Sync failed');
    }
  };

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav"><div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div><div className="ntl">Sync Wallet</div></div>
      <div className="sb" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0' }}>
          <div className={`sync-ring ${done ? 'sync-done' : ''}`} style={{ marginBottom: 18, ...(done ? { animation: 'none', borderColor: 'var(--green)' } : syncing ? {} : { animation: 'none' }) }} />
          <div style={{ fontSize: 18, fontWeight: 800 }}>{done ? 'Sync complete ✓' : syncing ? 'Syncing with server...' : 'Ready to sync'}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 5, textAlign: 'center' }}>
            {done ? `${results.length} transactions processed` : 'Pending transactions will be sent to the server for reconciliation'}
          </div>
        </div>
        <div style={{ height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${progress}%`, height: '100%', background: done ? 'var(--green)' : 'var(--accent)', borderRadius: 3, transition: 'width .25s' }} /></div>

        {error && <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, padding: '8px 12px', background: 'var(--rbg)', borderRadius: 'var(--r3)', border: '1px solid rgba(255,118,117,.2)' }}>{error}</div>}

        {results.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)' }}>
            <div style={{ flexShrink: 0 }}>
              {r.status === 'confirmed' ? (
                <svg width="18" height="18" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              )}
            </div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>TXN·{(r.id || '').slice(0, 8)}</div><div style={{ fontSize: 11, color: r.status === 'failed' ? 'var(--red)' : 'var(--green)' }}>{r.status === 'confirmed' ? 'Confirmed by server' : `Failed: ${r.fail_reason}`}</div></div>
          </div>
        ))}

        <button className="btn btn-p" onClick={startSync} disabled={syncing || !isOnline}>{syncing ? 'Syncing...' : done ? 'Sync Again' : 'Start Sync'}</button>
        {!isOnline && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Go online to sync</div>}

        <div className="card" style={{ padding: 13 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 5 }}>LAST SYNCED</div>
          <div style={{ fontSize: 13 }}>{lastSync || 'Never synced'}</div>
        </div>
      </div>
    </div>
  );
}
