import { useState, useEffect } from 'react';
import './index.css';
import Home from './Home';
import AuthPage from './AuthPage';
import { CartProvider } from './context/CartContext';
import { ReviewProvider } from './context/ReviewContext';
import CartDrawer from './components/CartDrawer';
import { authApi } from './api/api';

interface User {
  name: string;
  phone: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [blockedMsg, setBlockedMsg] = useState('');

  // Sahifa yuklanganda token va user ni tekshir
  useEffect(() => {
    const check = async () => {
      if (authApi.isLoggedIn()) {
        try {
          const me = await authApi.getMe();
          setUser({ name: me.name, phone: me.phone });
        } catch {
          const stored = authApi.getUser();
          if (stored) setUser({ name: stored.name, phone: stored.phone });
          else authApi.logout();
        }
      }
      setChecking(false);
    };
    check();
  }, []);

  // Admin tomonidan bloklanganda avtomatik chiqish
  useEffect(() => {
    const handleAuthLogout = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      authApi.logout();
      setUser(null);
      if (detail?.blocked) {
        setBlockedMsg('Sizning hisobingiz administrator tomonidan bloklandi.');
        setTimeout(() => setBlockedMsg(''), 6000);
      }
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage onSuccess={(u) => setUser(u)} />
        {/* Bloklash xabari login sahifasida ko'rinadi */}
        {blockedMsg && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 animate-bounce">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            {blockedMsg}
          </div>
        )}
      </>
    );
  }

  return (
    <ReviewProvider>
      <CartProvider>
        <Home user={user} onLogout={handleLogout} />
        <CartDrawer />
      </CartProvider>
    </ReviewProvider>
  );
}

export default App;
