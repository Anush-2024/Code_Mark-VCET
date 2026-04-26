import React, { useContext } from 'react';
import { UserContext } from '../App';
import WalletCard from '../components/WalletCard';
import { theme } from '../styles/theme';

export default function HomeScreen({ onSend, onReceive }) {
  const { name, upiId, balance, uuid, transactions } = useContext(UserContext);

  const containerStyle = {
    padding: theme.spacing.xl,
    paddingTop: '60px',
  };

  const headerStyle = {
    marginBottom: theme.spacing.xl
  };

  const nameStyle = {
    fontFamily: theme.typography.heading,
    fontSize: '28px',
    color: theme.colors.text,
    margin: 0
  };

  const upiStyle = {
    fontFamily: theme.typography.mono,
    fontSize: '14px',
    color: theme.colors.textSub,
    marginTop: '4px'
  };

  const actionsStyle = {
    display: 'flex',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl
  };

  const actionBtnStyle = (isSend) => ({
    flex: 1,
    padding: '24px 16px',
    backgroundColor: isSend ? theme.colors.surface : theme.colors.accent,
    color: isSend ? theme.colors.accent : theme.colors.bg,
    border: `1px solid ${isSend ? theme.colors.accent : 'transparent'}`,
    borderRadius: theme.borderRadius.md,
    fontFamily: theme.typography.heading,
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    boxShadow: isSend ? 'none' : theme.shadows.glow
  });

  const txnContainerStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ color: theme.colors.accent, fontFamily: theme.typography.heading, fontSize: '14px', letterSpacing: '2px', marginBottom: '16px' }}>
          AUDIOPAY
        </div>
        <h2 style={nameStyle}>Hello, {name}</h2>
        <div style={upiStyle}>{upiId}</div>
      </div>

      <WalletCard balance={balance} uuid={uuid} />

      <div style={actionsStyle}>
        <button style={actionBtnStyle(true)} onClick={onSend}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
          SEND
        </button>
        <button style={actionBtnStyle(false)} onClick={onReceive}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
          RECEIVE
        </button>
      </div>

      <div style={txnContainerStyle}>
        <h3 style={{ fontFamily: theme.typography.body, fontSize: '16px', color: theme.colors.textSub, marginTop: 0, marginBottom: theme.spacing.md }}>
          Recent Transactions
        </h3>
        {transactions.length === 0 ? (
          <div style={{ color: theme.colors.textMuted, fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            No recent transactions
          </div>
        ) : (
          transactions.map((t, i) => {
            const isSender = t.senderUUID === uuid;
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < transactions.length - 1 ? `1px solid ${theme.colors.border}` : 'none' }}>
                <div>
                  <div style={{ color: theme.colors.text, fontFamily: theme.typography.body, fontWeight: 500 }}>
                    {isSender ? `To ${t.receiverName}` : `From ${t.senderName}`}
                  </div>
                  <div style={{ color: theme.colors.textMuted, fontSize: '12px', marginTop: '4px' }}>
                    {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ color: isSender ? theme.colors.text : theme.colors.accent, fontFamily: theme.typography.mono, fontWeight: 700 }}>
                  {isSender ? '-' : '+'}₹{t.amountRupees}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
