import React from 'react';
import { theme } from '../styles/theme';

export default function SuccessScreen({ payment, onDone }) {
  const isSuccess = payment.isSuccess !== false;
  const isSender = payment.isSender;

  const containerStyle = {
    padding: theme.spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center'
  };

  const btnStyle = {
    width: '100%',
    padding: '16px',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    fontFamily: theme.typography.body,
    fontWeight: 700,
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '60px'
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            80% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      <div style={{
        width: '100px', height: '100px',
        borderRadius: '50%',
        backgroundColor: isSuccess ? theme.colors.accent : theme.colors.danger,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '32px',
        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        boxShadow: theme.shadows.glow
      }}>
        {isSuccess ? (
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke={theme.colors.bg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke={theme.colors.bg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        )}
      </div>

      <h2 style={{ fontFamily: theme.typography.heading, margin: '0 0 8px 0', fontSize: '28px' }}>
        {isSuccess ? (isSender ? 'Payment Sent!' : 'Payment Received!') : 'Payment Failed'}
      </h2>

      {isSuccess && (
        <>
          <div style={{ fontSize: '56px', fontFamily: theme.typography.heading, fontWeight: 800, color: theme.colors.text, margin: '24px 0', letterSpacing: '-1px' }}>
            ₹{payment.amountRupees}
          </div>

          <div style={{ color: theme.colors.textSub, fontSize: '18px' }}>
            {isSender ? 'Paid to ' : 'Received from '}
            <span style={{ color: theme.colors.text, fontWeight: 600 }}>
              {isSender ? payment.receiverName : payment.senderName}
            </span>
          </div>

          <div style={{ color: theme.colors.textMuted, fontSize: '14px', marginTop: '8px', fontFamily: theme.typography.mono }}>
            {new Date(payment.timestamp).toLocaleString()}
          </div>
        </>
      )}

      {!isSuccess && (
        <div style={{ color: theme.colors.textSub, fontSize: '18px', margin: '24px 0' }}>
          {payment.reason || 'Unknown error occurred'}
        </div>
      )}

      <button style={btnStyle} onClick={onDone}>
        Done
      </button>
    </div>
  );
}
