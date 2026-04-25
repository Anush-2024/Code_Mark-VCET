import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { getKeys, wipeKeys, getUserProfile, saveKeys, saveUserProfile } from '../services/storageService';
import { deriveKeyFromPIN, decryptPrivateKey } from '../services/cryptoService';
import { loginUser, getBalance } from '../services/apiService';
import Keypad from '../components/Keypad';
import jsQR from 'jsqr';

export default function Login() {
  const navigate = useNavigate();
  const { incrementPinAttempt, resetPinAttempts, isLocked, pinAttempts, loadUserProfile, loadWalletState, updateBalance, setUser } = useWalletStore();
  
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanInterval = useRef(null);

  useEffect(() => {
    getUserProfile().then(p => {
      if (p && p.phone) setPhone(p.phone.replace('+91', '').trim());
    });
  }, []);

  // Camera handling for Import QR
  const startScanner = async () => {
    setScanning(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      scanInterval.current = setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) handleImportQR(code.data);
      }, 200);
    } catch (err) {
      setScanning(false);
      setError('Camera permission required for sync.');
    }
  };

  const stopScanner = () => {
    setScanning(false);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (scanInterval.current) clearInterval(scanInterval.current);
  };

  const handleImportQR = async (data) => {
    try {
      const payload = JSON.parse(data);
      if (payload.t !== 'pp_transfer' || !payload.k || !payload.p) return;
      
      stopScanner();
      
      // Save keys and profile
      await saveKeys({
        pubKey: payload.k.pub,
        encPrivKey: payload.k.enc,
        iv: payload.k.iv,
        salt: payload.k.salt
      });
      
      await saveUserProfile({
        name: payload.p.name,
        phone: payload.p.phone,
        userId: payload.p.userId
      });
      
      setPhone(payload.p.phone.replace('+91', '').trim());
      setStep(2); // Jump to PIN entry
      setError('Wallet imported! Enter PIN to unlock.');
      setTimeout(() => setError(''), 3000);
    } catch (e) {
      console.warn('Invalid transfer QR');
    }
  };

  const handlePhoneSubmit = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setError('');
    
    try {
      const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const response = await loginUser({ phone: fullPhone });
      
      const keys = await getKeys();
      if (!keys.pubKey && response.backup) {
        // Automatically restore backup from server for new device
        await saveKeys({
          pubKey: response.pubKey,
          encPrivKey: response.backup.enc,
          iv: response.backup.iv,
          salt: response.backup.salt
        });
        await saveUserProfile({
          name: response.name,
          phone: fullPhone,
          userId: response.userId
        });
        setError('Wallet found! Enter PIN to restore.');
        setTimeout(() => setError(''), 3000);
      } else if (!keys.pubKey) {
        setError('No wallet found. Link from another device or recover with phrase.');
        return;
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleKey = async (key) => {
    if (isLocked) return;
    if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 6) {
        try {
          const keys = await getKeys();
          if (!keys.pubKey) { setError('No wallet found.'); setTimeout(() => { setPin(''); setError(''); setStep(1); }, 1500); return; }
          const saltBytes = Uint8Array.from(atob(keys.salt), c => c.charCodeAt(0));
          const aesKey = await deriveKeyFromPIN(newPin, saltBytes);
          await decryptPrivateKey(keys.encPrivKey, keys.iv, aesKey);
          
          let profile = await getUserProfile();
          const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
          
          if (profile && profile.phone !== fullPhone) throw new Error('PHONE_MISMATCH');

          if (!profile) {
             profile = { phone: fullPhone, name: 'User' };
             await setUser(profile);
          } else {
             await loadUserProfile();
          }

          try {
            await loginUser({ phone: profile.phone, pubKey: keys.pubKey });
            const serverWallet = await getBalance();
            if (serverWallet) await updateBalance({ confirmed_bal: serverWallet.confirmed_bal, locked_bal: serverWallet.locked_bal });
          } catch (apiErr) { console.warn('Offline mode login'); }
          
          resetPinAttempts();
          await loadWalletState();
          navigate('/home', { replace: true });
        } catch (e) {
          if (e.message === 'PHONE_MISMATCH') {
             setError('Phone mismatch.');
             setTimeout(() => { setPin(''); setError(''); setStep(1); }, 2000);
             return;
          }
          const locked = incrementPinAttempt();
          if (locked) { await wipeKeys(); setError('Locked. Keys wiped.'); }
          else { setError(`Wrong PIN.`); setTimeout(() => { setPin(''); setError(''); }, 1000); }
        }
      }
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  if (isLocked) {
    return (
      <div className="scr" style={{ display: 'flex' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div className="icon-hero" style={{ color: 'var(--red)', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Wallet Locked</div>
          <button className="btn btn-p" onClick={() => navigate('/recovery')}>Recover with phrase</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scr" style={{ display: 'flex' }}>
      <div className="tnav">
        <div className="bk" onClick={() => step === 2 ? setStep(1) : navigate(-1)}>
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <div className="ntl">Sign In</div>
      </div>
      
      {step === 1 ? (
        <div className="sb" style={{ padding: '24px 18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 30 }}>Enter your registered phone number.</div>
          
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 12, borderRight: '1px solid var(--border)' }}>
               <span style={{ fontSize: 14, fontWeight: 700 }}>+91</span>
            </div>
            <input 
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', padding: 0, fontSize: 16, letterSpacing: '2px', fontWeight: 600 }}
              placeholder="00000 00000" 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              autoFocus
            />
            <div onClick={startScanner} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
               <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><path d="M14 14h3v3h-3z"/></svg>
            </div>
          </div>
          
          {error && <div style={{ fontSize: 13, color: error.includes('imported') ? 'var(--green)' : 'var(--red)', fontWeight: 600, textAlign: 'center', padding: '8px', background: error.includes('imported') ? 'var(--gbg)' : 'var(--rbg)', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
          
          <div style={{ flex: 1 }} />
          <button className="btn btn-p" onClick={handlePhoneSubmit} disabled={phone.length < 10}>Continue</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '20px 18px' }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6 }}>Enter PIN</div>
          <div className="pdots">{[0,1,2,3,4,5].map(i => (<div key={i} className={`pd ${i < pin.length ? 'on' : ''} ${error ? 'err' : ''}`} />))}</div>
          <div style={{ fontSize: 12, color: 'var(--red)', height: 18, fontWeight: 600, textAlign: 'center', marginTop: 8 }}>{error}</div>
          <Keypad onKey={handleKey} onDelete={handleDelete} />
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginTop: 10 }}>
            Forgot PIN? <span style={{ color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/recovery')}>Recover wallet</span>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      <div className={`mover ${scanning ? 'show' : ''}`}>
        <div className="msheet" style={{ height: '70vh' }}>
          <div className="mhandle" onClick={stopScanner} />
          <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Sync from another device</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Scan the "Transfer QR" from your PC settings.</div>
            <div style={{ flex: 1, width: '100%', background: '#000', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="sfr" style={{ inset: '15%' }}><div className="sc tl"/><div className="sc tr"/><div className="sc bl"/><div className="sc br"/><div className="sline"/></div>
            </div>
            <button className="btn btn-s" style={{ marginTop: 16 }} onClick={stopScanner}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
