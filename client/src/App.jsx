import { useEffect } from 'react';
import { RouterProvider, createHashRouter, Outlet, useLocation } from 'react-router-dom';
import { useWalletStore } from './store/walletStore';
import { ToastContainer } from './components/Toast';
import Sidebar from './components/Sidebar';

import Splash from './screens/Splash';
import Register from './screens/Register';
import OTPVerify from './screens/OTPVerify';
import PinSetup from './screens/PinSetup';
import RecoveryPhrase from './screens/RecoveryPhrase';
import Login from './screens/Login';
import Recovery from './screens/Recovery';
import Home from './screens/Home';
import Send from './screens/Send';
import SendConfirm from './screens/SendConfirm';
import QRScreen from './screens/QRScreen';
import Receive from './screens/Receive';
import History from './screens/History';
import TxnDetail from './screens/TxnDetail';
import AddMoney from './screens/AddMoney';
import Withdraw from './screens/Withdraw';
import Merchant from './screens/Merchant';
import SyncScreen from './screens/SyncScreen';
import Notifications from './screens/Notifications';
import Profile from './screens/Profile';
import Settings from './screens/Settings';

// Auth screens render centered without sidebar
function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card"><Outlet /></div>
    </div>
  );
}

// Dashboard screens render with sidebar
function DashboardLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main"><Outlet /></div>
    </div>
  );
}

const router = createHashRouter([
  // Auth flow — no sidebar
  { element: <AuthLayout />, children: [
    { path: '/', element: <Splash /> },
    { path: '/register', element: <Register /> },
    { path: '/otp', element: <OTPVerify /> },
    { path: '/pin-setup', element: <PinSetup /> },
    { path: '/recovery-phrase', element: <RecoveryPhrase /> },
    { path: '/login', element: <Login /> },
    { path: '/recovery', element: <Recovery /> },
  ]},
  // Dashboard — with sidebar
  { element: <DashboardLayout />, children: [
    { path: '/home', element: <Home /> },
    { path: '/send', element: <Send /> },
    { path: '/send/confirm', element: <SendConfirm /> },
    { path: '/send/qr', element: <QRScreen /> },
    { path: '/receive', element: <Receive /> },
    { path: '/history', element: <History /> },
    { path: '/history/:id', element: <TxnDetail /> },
    { path: '/add-money', element: <AddMoney /> },
    { path: '/withdraw', element: <Withdraw /> },
    { path: '/merchant', element: <Merchant /> },
    { path: '/sync', element: <SyncScreen /> },
    { path: '/notifications', element: <Notifications /> },
    { path: '/profile', element: <Profile /> },
    { path: '/settings', element: <Settings /> },
  ]},
]);

export default function App() {
  const { theme, loadUserProfile, loadWalletState, setOnline } = useWalletStore();

  useEffect(() => {
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    loadUserProfile();
    loadWalletState();
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}
