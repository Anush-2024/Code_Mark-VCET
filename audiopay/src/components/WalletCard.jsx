import React, { useState } from 'react';
import { theme } from '../styles/theme';
import socket from '../socket';

export default function WalletCard({ balance, uuid }) {
  const [addAmount, setAddAmount] = useState('');

  const handleAddFunds = () => {
    const amt = parseInt(addAmount);
    if (amt > 0) {
      socket.emit('add_funds', { uuid, amountRupees: amt });
      setAddAmount('');
    }
  };

  const cardStyle = {
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  };

  const balanceStyle = {
    fontFamily: theme.typography.heading,
    fontSize: '48px',
    fontWeight: 800,
    color: theme.colors.text,
    margin: '10px 0',
    letterSpacing: '-1px'
  };

  const inputGroupStyle = {
    display: 'flex',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm
  };

  const inputStyle = {
    flex: 1,
    backgroundColor: theme.colors.surface2,
    border: `1px solid ${theme.colors.border2}`,
    borderRadius: theme.borderRadius.sm,
    padding: '0 12px',
    color: theme.colors.text,
    fontFamily: theme.typography.mono,
    outline: 'none'
  };

  const btnStyle = {
    backgroundColor: theme.colors.border2,
    color: theme.colors.text,
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    padding: '8px 16px',
    fontFamily: theme.typography.body,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s'
  };

  return (
    <div style={cardStyle}>
      <div style={{ color: theme.colors.textSub, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
        Wallet Balance
      </div>
      <div style={balanceStyle}>
        ₹{balance.toLocaleString('en-IN')}
      </div>
      
      <div style={inputGroupStyle}>
        <input 
          style={inputStyle} 
          type="number" 
          placeholder="Amount ₹" 
          value={addAmount}
          onChange={e => setAddAmount(e.target.value)}
        />
        <button 
          style={btnStyle} 
          onClick={handleAddFunds}
          onMouseOver={e => e.target.style.backgroundColor = theme.colors.accent}
          onMouseOut={e => e.target.style.backgroundColor = theme.colors.border2}
        >
          Add Funds
        </button>
      </div>
    </div>
  );
}
