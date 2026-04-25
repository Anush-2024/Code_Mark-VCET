import { useNavigate } from 'react-router-dom';

const NOTIFS = [
  { id: '1', type: 'sync_done', title: 'Sync completed', body: '5 transactions confirmed. Your balance is now up-to-date.', time: '2 hours ago', read: false },
  { id: '2', type: 'money_received', title: 'Payment received', body: 'You received ₹200 from Rahul Kumar. Unconfirmed until sync.', time: '3 hours ago', read: false },
  { id: '3', type: 'txn_failed', title: 'Double-spend blocked', body: 'Transaction #a3f8b2 was rejected — nonce already used. ₹150 restored to your balance.', time: '1 day ago', read: true },
  { id: '4', type: 'withdrawal', title: 'Withdrawal processed', body: '₹1,000 transferred to HDFC Bank xxxx 4321. UTR: HDFC20240125001', time: '2 days ago', read: true },
  { id: '5', type: 'daily_limit', title: 'Daily limit warning', body: "You've used ₹1,800 of your ₹2,000 daily offline limit. ₹200 remaining.", time: '3 days ago', read: true },
];

export default function Notifications() {
  const navigate = useNavigate();
  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav">
        <div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div className="ntl">Notifications</div>
        <div className="nact"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      </div>
      <div className="sb" style={{ padding: '14px 18px' }}>
        {NOTIFS.map(n => (
          <div key={n.id} className={`notif ${!n.read ? 'unr' : ''}`}>
            <div className="notif-t">{n.title}</div>
            <div className="notif-b">{n.body}</div>
            <div className="notif-tm">{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
