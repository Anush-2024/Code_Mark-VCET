import React from 'react';
import { theme } from '../styles/theme';

export default function ReceiverCard({ name, upiId, lastSeen, onPay, disabled, buttonText = 'Pay' }) {
  const isStale = Date.now() - lastSeen > 8000;
  
  const cardStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${isStale ? theme.colors.border : theme.colors.accent}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    opacity: isStale ? 0.5 : 1,
    transition: 'all 0.3s ease',
    boxShadow: isStale ? 'none' : theme.shadows.glow
  };

  const btnStyle = {
    backgroundColor: theme.colors.accent,
    color: theme.colors.bg,
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    padding: '8px 24px',
    fontFamily: theme.typography.body,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1
  };

  return (
    <div style={cardStyle}>
      <div>
        <div style={{ fontFamily: theme.typography.heading, fontSize: '18px', color: theme.colors.text }}>
          {name}
        </div>
        <div style={{ fontFamily: theme.typography.mono, fontSize: '12px', color: theme.colors.textSub, marginTop: '4px' }}>
          {upiId}
        </div>
      </div>
      <button 
        style={btnStyle} 
        onClick={onPay}
        disabled={disabled}
      >
        {buttonText}
      </button>
    </div>
  );
}
