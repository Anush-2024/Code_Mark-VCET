import React, { useState, useEffect, useRef } from 'react';
import { theme } from '../styles/theme';
import { buildPayload, startBroadcasting } from '../audio-pay-module';
import socket from '../socket';

export default function ReceiverScreen({ onBack, userUUID, userName, userUpiId, onPaymentReceived }) {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [successData, setSuccessData] = useState(null);
  
  const broadcastRef = useRef(null);

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  useEffect(() => {
    if (onPaymentReceived) {
      if (onPaymentReceived.receiverUUID !== userUUID) return;
      
      console.log('[RECEIVER] payment received from:', onPaymentReceived.senderName);
      
      // Stop the broadcast immediately
      stop();
      setSuccessData(onPaymentReceived);
    }
  }, [onPaymentReceived, userUUID]);

  const stop = () => {
    if (broadcastRef.current) {
      broadcastRef.current.stop();
      broadcastRef.current = null;
    }
    setIsBroadcasting(false);
    setCycle(0);
  };

  const startCustomLoop = async () => {
    setIsBroadcasting(true);
    
    let running = true;
    
    broadcastRef.current = {
      stop: () => { running = false; }
    };

    const loop = async () => {
      if (!running) return;
      
      const { broadcastPayload } = await import('../audio-pay-module/encoder');
      const payload = await buildPayload(userUUID);
      
      const senderId = payload.substring(1, 9);
      const nonce = payload.substring(9, 17);
      
      // Register nonce
      socket.emit('register_nonce', { senderUUID: senderId, nonce });
      
      setCycle(c => c + 1);
      await broadcastPayload(payload);
      
      if (running) {
        setTimeout(loop, 1200); // Wait between cycles
      }
    };
    
    loop();
  };

  const toggle = () => {
    if (isBroadcasting) stop();
    else startCustomLoop();
  };

  const containerStyle = {
    padding: theme.spacing.xl,
    paddingTop: '60px',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    alignItems: 'center'
  };

  const btnStyle = {
    width: '100%',
    padding: '16px',
    backgroundColor: isBroadcasting ? theme.colors.surface2 : theme.colors.accent,
    color: isBroadcasting ? theme.colors.text : theme.colors.bg,
    border: isBroadcasting ? `1px solid ${theme.colors.border}` : 'none',
    borderRadius: theme.borderRadius.md,
    fontFamily: theme.typography.body,
    fontWeight: 700,
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: 'auto',
    marginBottom: theme.spacing.xl,
    transition: 'all 0.3s ease'
  };

  return (
    <div style={containerStyle}>
      <button 
        onClick={() => { stop(); onBack(); }}
        style={{ background: 'none', border: 'none', color: theme.colors.text, fontSize: '16px', cursor: 'pointer', padding: 0, alignSelf: 'flex-start', marginBottom: theme.spacing.xl }}
      >
        ← Back
      </button>

      <h2 style={{ fontFamily: theme.typography.heading, margin: '0 0 8px 0' }}>Receive Money</h2>
      <p style={{ color: theme.colors.textSub, textAlign: 'center', margin: '0 0 40px 0' }}>
        {userName} • {userUpiId}
      </p>

      <style>
        {`
          @keyframes ripple {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          .pulse-ring {
            position: absolute;
            border: 2px solid ${theme.colors.accent};
            border-radius: 50%;
            width: 100%;
            height: 100%;
            animation: ripple 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          }
          .pulse-ring:nth-child(2) { animation-delay: 0.5s; }
          .pulse-ring:nth-child(3) { animation-delay: 1.0s; }
          .pulse-ring:nth-child(4) { animation-delay: 1.5s; }
        `}
      </style>

      <div style={{ position: 'relative', width: '120px', height: '120px', margin: '60px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {isBroadcasting && (
          <>
            <div className="pulse-ring" />
            <div className="pulse-ring" />
            <div className="pulse-ring" />
            <div className="pulse-ring" />
          </>
        )}
        <div style={{
          width: '120px', height: '120px', 
          borderRadius: '50%', 
          backgroundColor: isBroadcasting ? theme.colors.surface : theme.colors.surface2,
          border: `1px solid ${isBroadcasting ? theme.colors.accent : theme.colors.border}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          boxShadow: isBroadcasting ? theme.shadows.glow : 'none',
          transition: 'all 0.3s ease'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={isBroadcasting ? theme.colors.accent : theme.colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </div>
      </div>

      <div style={{ fontFamily: theme.typography.mono, color: theme.colors.accent, height: '24px', transition: 'opacity 0.3s', opacity: isBroadcasting ? 1 : 0 }}>
        Broadcasting... Cycle {cycle}
      </div>

      <button style={btnStyle} onClick={toggle}>
        {isBroadcasting ? 'Stop Broadcasting' : 'Start Broadcasting'}
      </button>
    </div>
  );
}
