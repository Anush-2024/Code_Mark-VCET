import { useNavigate, useLocation } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';

const NAV = [
  { path: '/home', label: 'Dashboard', icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
  { path: '/send', label: 'Send Money', icon: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></> },
  { path: '/receive', label: 'Receive', icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></> },
  { section: 'Wallet' },
  { path: '/add-money', label: 'Add Money', icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></> },
  { path: '/withdraw', label: 'Withdraw', icon: <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></> },
  { path: '/history', label: 'History', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
  { section: 'Tools' },
  { path: '/sync', label: 'Sync', icon: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></> },
  { path: '/merchant', label: 'Merchant', icon: <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></> },
  { path: '/notifications', label: 'Notifications', icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isOnline } = useWalletStore();
  const current = location.pathname;
  const initial = (user?.name || 'U')[0].toUpperCase();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>
        </div>
        <div className="sidebar-logo-text">PocketPay</div>
      </div>

      <div className="sidebar-nav">
        {NAV.map((item, i) => {
          if (item.section) return <div key={i} className="sidebar-section">{item.section}</div>;
          return (
            <div key={item.path} className={`sidebar-item ${current === item.path ? 'active' : ''}`} onClick={() => navigate(item.path)}>
              <svg viewBox="0 0 24 24">{item.icon}</svg>
              {item.label}
              {item.path === '/sync' && isOnline && <div className="badge-dot" />}
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => navigate('/settings')}>
          <div className="sidebar-avatar">{initial}</div>
          <div>
            <div className="sidebar-uname">{user?.name || 'User'}</div>
            <div className="sidebar-ustatus">
              <span className={`dot ${isOnline ? 'on' : 'off'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
