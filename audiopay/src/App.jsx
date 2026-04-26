import React, { createContext, useState, useEffect } from 'react';
import socket from './socket';
import HomeScreen from './screens/HomeScreen';
import SenderScreen from './screens/SenderScreen';
import ReceiverScreen from './screens/ReceiverScreen';
import SuccessScreen from './screens/SuccessScreen';
import ToastNotification from './components/ToastNotification';
import { theme } from './styles/theme';

export const UserContext = createContext();

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function App() {
  const [user, setUser] = useState({ uuid: '', name: '', upiId: '', balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [toast, setToast] = useState(null); // { message, type }
  
  // Registration flow
  const [isRegistered, setIsRegistered] = useState(false);
  const [regName, setRegName] = useState('');
  const [regUpi, setRegUpi] = useState('');

  // Routing state: 'home', 'send', 'receive', 'success'
  const [currentScreen, setCurrentScreen] = useState('home');
  const [successPayment, setSuccessPayment] = useState(null);
  
  // Create a ref or state for passing to receiver
  const [incomingPayment, setIncomingPayment] = useState(null);

  useEffect(() => {
    // Load or create credentials
    let myUUID = localStorage.getItem('audiopay_uuid');
    const name = localStorage.getItem('audiopay_name');
    const upiId = localStorage.getItem('audiopay_upiId');

    if (!myUUID) {
      myUUID = generateUUID();
      localStorage.setItem('audiopay_uuid', myUUID);
    }

    if (name && upiId) {
      // Re-register
      socket.emit('register_user', { uuid: myUUID, name, upiId });
    } else {
      setUser(prev => ({ ...prev, uuid: myUUID }));
    }

    // Socket Listeners
    socket.on('connect', () => {
      const storedUuid = localStorage.getItem('audiopay_uuid');
      const storedName = localStorage.getItem('audiopay_name');
      const storedUpiId = localStorage.getItem('audiopay_upiId');
      if (storedUuid && storedName && storedUpiId) {
        socket.emit('register_user', { uuid: storedUuid, name: storedName, upiId: storedUpiId });
      }
    });

    socket.on('user_registered', (userData) => {
      setUser(userData);
      setIsRegistered(true);
      localStorage.setItem('audiopay_name', userData.name);
      localStorage.setItem('audiopay_upiId', userData.upiId);
    });

    socket.on('balance_update', ({ uuid, balance }) => {
      console.log('[APP] balance_update:', uuid, balance);
      if (uuid === myUUID) {
        setUser(prev => ({ ...prev, balance }));
      }
    });

    socket.on('payment_success', (data) => {
      console.log('[APP] payment_success received:', data);
      setTransactions(prev => [data, ...prev].slice(0, 5));
      
      const isSender = data.senderUUID === myUUID;
      const amount = data.amountRupees;
      const otherName = isSender ? data.receiverName : data.senderName;
      
      setToast({
        message: isSender ? `Paid ₹${amount} to ${otherName}` : `Received ₹${amount} from ${otherName}`,
        type: isSender ? 'send' : 'receive'
      });

      setSuccessPayment({ ...data, isSender, isSuccess: true });
      
      if (!isSender && currentScreen === 'receive') {
        // Let the ReceiverScreen know to stop broadcasting
        setIncomingPayment(data);
      }
      
      setCurrentScreen('success');
    });

    socket.on('payment_failed', ({ reason }) => {
      console.log('[APP] payment_failed:', reason);
      setToast({ message: `Payment failed: ${reason}`, type: 'error' });
      setSuccessPayment({ reason, isSuccess: false });
      setCurrentScreen('success');
    });

    return () => {
      socket.off('connect');
      socket.off('user_registered');
      socket.off('balance_update');
      socket.off('payment_success');
      socket.off('payment_failed');
    };
  }, [currentScreen]);

  const handleRegister = (e) => {
    e.preventDefault();
    if (regName.trim() && regUpi.trim()) {
      const formattedName = regName.trim().toUpperCase().substring(0, 8).replace(/[^A-Z0-9]/g, '');
      socket.emit('register_user', { 
        uuid: user.uuid, 
        name: formattedName, 
        upiId: regUpi.trim() 
      });
    }
  };

  const addTransaction = (txn) => {
    setTransactions(prev => [txn, ...prev].slice(0, 5));
  };

  const containerStyle = {
    width: '100%',
    maxWidth: '430px', // Mobile constraint
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden'
  };

  const regContainerStyle = {
    padding: theme.spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: '100vh',
  };

  const inputStyle = {
    width: '100%',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface2,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.text,
    fontFamily: theme.typography.mono,
    fontSize: '16px',
    marginBottom: theme.spacing.md,
    outline: 'none'
  };

  const buttonStyle = {
    width: '100%',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.accent,
    color: theme.colors.bg,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontFamily: theme.typography.body,
    fontWeight: 700,
    fontSize: '16px',
    cursor: 'pointer'
  };

  if (!isRegistered) {
    return (
      <div style={containerStyle}>
        <div style={regContainerStyle}>
          <h1 style={{ fontFamily: theme.typography.heading, fontSize: '32px', marginBottom: '8px' }}>
            Welcome to <span style={{ color: theme.colors.accent }}>AudioPay</span>
          </h1>
          <p style={{ color: theme.colors.textSub, marginBottom: '32px' }}>
            Setup your offline wallet
          </p>
          <form onSubmit={handleRegister}>
            <input 
              style={inputStyle}
              placeholder="Display Name (Max 8 chars)" 
              maxLength={8}
              value={regName}
              onChange={e => setRegName(e.target.value)}
              required
            />
            <input 
              style={inputStyle}
              placeholder="UPI ID (e.g., name@bank)" 
              value={regUpi}
              onChange={e => setRegUpi(e.target.value)}
              required
            />
            <button style={buttonStyle} type="submit">Create Wallet</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ ...user, setBalance: (b) => setUser(p => ({...p, balance: b})), transactions, addTransaction }}>
      <div style={containerStyle}>
        {currentScreen === 'home' && (
          <HomeScreen 
            onSend={() => setCurrentScreen('send')}
            onReceive={() => {
              setIncomingPayment(null);
              setCurrentScreen('receive');
            }}
          />
        )}
        
        {currentScreen === 'send' && (
          <SenderScreen 
            onBack={() => setCurrentScreen('home')}
            userUUID={user.uuid}
            userBalance={user.balance}
          />
        )}
        
        {currentScreen === 'receive' && (
          <ReceiverScreen 
            onBack={() => setCurrentScreen('home')}
            userUUID={user.uuid}
            userName={user.name}
            userUpiId={user.upiId}
            onPaymentReceived={incomingPayment}
          />
        )}

        {currentScreen === 'success' && successPayment && (
          <SuccessScreen 
            payment={successPayment}
            onDone={() => {
              setSuccessPayment(null);
              setCurrentScreen('home');
            }}
          />
        )}

        {toast && (
          <ToastNotification 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </div>
    </UserContext.Provider>
  );
}

export default App;
