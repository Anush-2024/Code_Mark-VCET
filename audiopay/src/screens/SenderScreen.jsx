import React, { useState, useEffect, useRef } from 'react';
import { theme } from '../styles/theme';
import { startListening, validatePayload } from '../audio-pay-module';
import socket from '../socket';
import ReceiverCard from '../components/ReceiverCard';

export default function SenderScreen({ onBack, userUUID, userBalance }) {
  const [amount, setAmount] = useState('');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [phase, setPhase] = useState('input'); // input, scanning, paying
  const [error, setError] = useState('');
  
  // Audio state
  const [status, setStatus] = useState('');
  const [signalLevel, setSignalLevel] = useState(-100);
  const [receivers, setReceivers] = useState([]); // Array of { uuid, name, upiId, nonce, lastSeen }
  
  const [nonceStatus, setNonceStatus] = useState({}); 
  const [acceptedNonces, setAcceptedNonces] = useState({});

  const listenerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (listenerRef.current) listenerRef.current.stop();
    };
  }, []);

  // Listen for socket responses
  useEffect(() => {
    const handleUserFound = (user) => {
      console.log('[SENDER] user resolved:', user.name);
      
      setReceivers(prev => {
        const exists = prev.find(r => r.uuid === user.uuid);
        if (exists) {
          return prev.map(r => r.uuid === user.uuid
            ? { ...r, lastSeen: Date.now() }
            : r);
        }
        
        // Also clean up any temporary fragment cards
        const fragmentMatch = prev.find(r => user.uuid.replace(/-/g, '').startsWith(r.uuid) || user.uuid.startsWith(r.uuid));
        if (fragmentMatch) {
            return prev.map(r => r.uuid === fragmentMatch.uuid ? { ...r, uuid: user.uuid, name: user.name, upiId: user.upiId, lastSeen: Date.now() } : r);
        }
        
        return [...prev, { ...user, lastSeen: Date.now() }];
      });
      
      // Also update acceptedNonces and nonceStatus to map the full UUID to the fragment's nonce
      setAcceptedNonces(prev => {
        const fragmentKey = Object.keys(prev).find(frag => user.uuid.replace(/-/g, '').startsWith(frag));
        if (fragmentKey && !prev[user.uuid]) {
          return { ...prev, [user.uuid]: prev[fragmentKey] };
        }
        return prev;
      });
      setNonceStatus(prev => {
        const fragmentKey = Object.keys(prev).find(frag => user.uuid.replace(/-/g, '').startsWith(frag));
        if (fragmentKey && !prev[user.uuid]) {
          return { ...prev, [user.uuid]: prev[fragmentKey] };
        }
        return prev;
      });
    };

    const handleUserNotFound = ({ fragment }) => {
      console.warn('[Sender] no user found for fragment:', fragment);
    };

    const handleNonceAccepted = ({ senderUUID, nonce }) => {
      // senderUUID here is the fragment. We update the state.
      setNonceStatus(prev => ({ ...prev, [senderUUID]: 'accepted' }));
      setAcceptedNonces(prev => ({ ...prev, [senderUUID]: nonce }));
    };

    const handleNonceRejected = ({ senderUUID }) => {
      setNonceStatus(prev => ({ ...prev, [senderUUID]: 'rejected' }));
    };

    socket.on('user_found', handleUserFound);
    socket.on('user_not_found', handleUserNotFound);
    socket.on('nonce_accepted', handleNonceAccepted);
    socket.on('nonce_rejected', handleNonceRejected);

    return () => {
      socket.off('user_found', handleUserFound);
      socket.off('user_not_found', handleUserNotFound);
      socket.off('nonce_accepted', handleNonceAccepted);
      socket.off('nonce_rejected', handleNonceRejected);
    };
  }, []);

  const handleScanClick = () => {
    setError('');
    const amt = parseInt(amount);
    
    if (isNaN(amt) || amt <= 0 || amt > 9999) {
      setError('Amount must be between ₹1 and ₹9999');
      return;
    }
    if (amt > userBalance) {
      setError('Insufficient balance');
      return;
    }

    setPhase('scanning');
    
    listenerRef.current = startListening(
      // onPayload
      (payloadString, validation) => {
        const fragment = validation.senderUUID || payloadString.substring(1, 9);
        const nonce = validation.nonce || Date.now().toString(); // Use actual nonce
        
        console.log('[SENDER] detected fragment:', fragment);
        
        setNonceStatus(prev => ({ ...prev, [fragment]: 'pending' }));

        socket.emit('register_nonce', { 
          senderUUID: fragment,
          nonce: nonce 
        });

        // Add a temporary card until we resolve the user
        setReceivers(prev => {
          const existing = prev.find(r => r.uuid === fragment || r.uuid.replace(/-/g, '').startsWith(fragment));
          if (existing) {
            return prev.map(r => (r.uuid === fragment || r.uuid.replace(/-/g, '').startsWith(fragment)) ? { ...r, lastSeen: Date.now() } : r);
          } else {
            return [...prev, { uuid: fragment, name: '', upiId: '', lastSeen: Date.now() }];
          }
        });

        // Look up real user info from backend
        socket.emit('lookup_user', { fragment });
      },
      // onStatus
      (st) => setStatus(st),
      // onSignalLevel
      (lvl) => setSignalLevel(lvl)
    );
  };

  const handlePayClick = (receiver) => {
    if (phase === 'paying') return;
    
    const nonce = acceptedNonces[receiver.uuid];
    if (!nonce) {
      setError('Transaction not ready. Wait a moment and try again.');
      return;
    }
    
    // Disable pay button if we haven't resolved the user name yet
    if (!receiver.name || receiver.name === 'Connecting...') {
      return;
    }
    
    setPhase('paying');
    setError('');
    
    // Stop listening
    if (listenerRef.current) {
      listenerRef.current.stop();
      listenerRef.current = null;
    }

    // Attempt payment
    // The amount is supplied by the sender, not the receiver payload
    socket.emit('initiate_payment', {
      senderUUID: userUUID,
      receiverUUID: receiver.uuid, // full UUID from backend lookup
      amountRupees: parseInt(amount),
      nonce: nonce
    });
  };

  const containerStyle = {
    padding: theme.spacing.xl,
    paddingTop: '60px',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh'
  };

  const inputStyle = {
    width: '100%',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface2,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.text,
    fontFamily: theme.typography.mono,
    fontSize: '24px',
    marginBottom: theme.spacing.md,
    outline: 'none',
    textAlign: 'center'
  };

  const btnStyle = {
    width: '100%',
    padding: '16px',
    backgroundColor: theme.colors.accent,
    color: theme.colors.bg,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontFamily: theme.typography.body,
    fontWeight: 700,
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: 'auto',
    marginBottom: theme.spacing.xl
  };

  // Signal visualizer bar calculation
  const getBarHeight = (baseHeight) => {
    // scale from -90dB (0) to -30dB (100%)
    const normalized = Math.max(0, Math.min(1, (signalLevel + 90) / 60));
    return Math.max(4, baseHeight * normalized); // min 4px
  };

  return (
    <div style={containerStyle}>
      <button 
        onClick={() => {
          if (listenerRef.current) listenerRef.current.stop();
          onBack();
        }}
        style={{ background: 'none', border: 'none', color: theme.colors.text, fontSize: '16px', textAlign: 'left', cursor: 'pointer', padding: 0, marginBottom: theme.spacing.xl }}
      >
        ← Back
      </button>

      {phase === 'input' && (
        <>
          <h2 style={{ fontFamily: theme.typography.heading, margin: '0 0 24px 0' }}>Send Money</h2>
          <div style={{ color: theme.colors.textSub, marginBottom: '8px', textAlign: 'center' }}>Amount (₹)</div>
          <input 
            type="number"
            style={inputStyle}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            autoFocus
          />
          <div style={{ color: theme.colors.textSub, marginBottom: '8px', textAlign: 'center', marginTop: '16px' }}>Recipient UPI (Optional)</div>
          <input 
            type="text"
            style={{...inputStyle, fontSize: '16px'}}
            value={upiIdInput}
            onChange={e => setUpiIdInput(e.target.value)}
            placeholder="Will auto-fill via audio"
          />
          
          {error && <div style={{ color: theme.colors.danger, textAlign: 'center', marginTop: '16px' }}>{error}</div>}
          
          <div style={{ marginTop: '32px', textAlign: 'center', color: theme.colors.textSub }}>
            Wallet Balance: ₹{userBalance}
          </div>

          <button style={btnStyle} onClick={handleScanClick}>Scan for Receivers</button>
        </>
      )}

      {phase === 'scanning' && (
        <>
          <h2 style={{ fontFamily: theme.typography.heading, margin: '0 0 8px 0', textAlign: 'center' }}>
            Sending ₹{amount}
          </h2>
          <p style={{ color: theme.colors.textSub, textAlign: 'center', margin: '0 0 32px 0' }}>
            Bring phones close together
          </p>

          {/* Visualizer */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '100px', gap: '4px', marginBottom: '24px' }}>
            {[1,2,3,4,5,6,7,8,9,10,11,12,11,10,9,8,7,6,5,4,3,2,1].map((mult, i) => (
              <div 
                key={i} 
                style={{
                  width: '6px',
                  backgroundColor: status === 'receiving' ? theme.colors.accent : theme.colors.textMuted,
                  borderRadius: '3px',
                  height: `${getBarHeight(mult * 8)}px`,
                  transition: 'height 0.05s ease-out'
                }}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', color: status === 'error' ? theme.colors.danger : theme.colors.accent, fontFamily: theme.typography.mono, marginBottom: '32px' }}>
            {status === 'listening' && 'Listening for tone...'}
            {status === 'receiving' && 'Receiving data...'}
            {status === 'done' && 'Payload verified'}
            {status === 'error' && 'Microphone error'}
            {status === 'crowded' && 'Signal crowded — move away'}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <h3 style={{ fontSize: '14px', color: theme.colors.textSub, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Detected Receivers
            </h3>
            {receivers.length === 0 ? (
              <div style={{ textAlign: 'center', color: theme.colors.textMuted, marginTop: '40px' }}>
                No receivers found yet.
              </div>
            ) : (
              receivers.map(r => (
                <ReceiverCard 
                  key={r.uuid} 
                  name={r.name || 'Connecting...'} 
                  upiId={r.upiId || r.uuid?.substring(0, 8) || '...'} 
                  lastSeen={r.lastSeen}
                  onPay={() => handlePayClick(r)}
                  disabled={nonceStatus[r.uuid] !== 'accepted' || !r.name || r.name === 'Connecting...'}
                  buttonText={nonceStatus[r.uuid] === 'pending' ? 'Verifying...' : 'Pay'}
                />
              ))
            )}
          </div>
          
          {error && <div style={{ color: theme.colors.danger, textAlign: 'center', marginBottom: '16px' }}>{error}</div>}
        </>
      )}

      {phase === 'paying' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <style>
            {`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}
          </style>
          <div style={{ 
            width: '60px', height: '60px', 
            border: `4px solid ${theme.colors.border}`,
            borderTopColor: theme.colors.accent,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '24px'
          }} />
          <h2 style={{ fontFamily: theme.typography.heading }}>Processing...</h2>
          <p style={{ color: theme.colors.textSub }}>Settling payment securely</p>
        </div>
      )}
    </div>
  );
}
