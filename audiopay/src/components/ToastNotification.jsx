import React, { useEffect, useState } from 'react';
import { theme } from '../styles/theme';

export default function ToastNotification({ message, type, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 3700);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? theme.colors.danger : theme.colors.surface2;
  const borderColor = type === 'error' ? theme.colors.danger : theme.colors.accent;

  const style = {
    position: 'absolute',
    top: visible ? theme.spacing.lg : '-100px',
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: bgColor,
    border: `1px solid ${borderColor}`,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontWeight: 500,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    transition: 'top 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    zIndex: 1000,
    overflow: 'hidden'
  };

  const progressStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    backgroundColor: type === 'error' ? '#fff' : theme.colors.accent,
    width: visible ? '0%' : '100%',
    transition: 'width 3.7s linear'
  };

  // Trigger progress animation on mount
  useEffect(() => {
    const el = document.getElementById('toast-progress');
    if (el) {
      // Force reflow
      void el.offsetWidth;
      el.style.width = '0%';
    }
  }, []);

  return (
    <div style={style}>
      {message}
      <div id="toast-progress" style={{ ...progressStyle, width: '100%' }} />
    </div>
  );
}
