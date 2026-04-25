import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Keypad from '../components/Keypad';

export default function PinSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const regData = location.state || {};
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [phase, setPhase] = useState('create'); // create | confirm
  const [hint, setHint] = useState('');

  const handleKey = (key) => {
    if (phase === 'create') {
      if (pin.length < 6) {
        const newPin = pin + key;
        setPin(newPin);
        if (newPin.length === 6) {
          setTimeout(() => {
            setPhase('confirm');
            setHint('');
          }, 200);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newPin = confirmPin + key;
        setConfirmPin(newPin);
        if (newPin.length === 6) {
          if (newPin === pin) {
            navigate('/recovery-phrase', { state: { ...regData, pin: newPin } });
          } else {
            setHint("PINs don't match. Try again.");
            setTimeout(() => { setConfirmPin(''); setHint(''); }, 800);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (phase === 'create') setPin(p => p.slice(0, -1));
    else setConfirmPin(p => p.slice(0, -1));
  };

  const currentPin = phase === 'create' ? pin : confirmPin;

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav">
        <div className="bk" onClick={() => navigate(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div className="ntl">{phase === 'create' ? 'Set PIN' : 'Confirm PIN'}</div>
      </div>
      <div style={{ textAlign: 'center', padding: '24px 18px 16px' }}>
        <div style={{ fontSize: 15, color: 'var(--text2)' }}>{phase === 'create' ? 'Create a 6-digit PIN to secure your wallet' : 'Re-enter your PIN to confirm'}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
        <div className="pdots">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className={`pd ${i < currentPin.length ? 'on' : ''} ${hint ? 'err' : ''}`} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--red)', height: 18, fontWeight: 600 }}>{hint}</div>
        <div style={{ height: 20 }} />
        <Keypad onKey={handleKey} onDelete={handleDelete} />
      </div>
    </div>
  );
}
