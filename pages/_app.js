import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../src/components/Navigation';
import { useAppState } from '../src/utils/useAppState';
import { decodeToken, getToken, setToken, removeToken } from '../src/utils/api';
import '../src/index.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');

  const appState = useAppState();

  // Initialize on mount
  useEffect(() => {
    const token = getToken();
    const storedAdmin = localStorage.getItem('isAdmin') === 'true';
    const storedUsername = localStorage.getItem('username');
    
    if (token) {
      try {
        const decoded = decodeToken(token);
        if (decoded) {
          setIsLoggedIn(true);
          setUsername(storedUsername || decoded.username);
          setIsAdmin(storedAdmin || decoded.role === 'admin');
        }
      } catch (error) {
        console.error('Token decode error:', error);
        removeToken();
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('username');
      }
    }
    // Let individual pages fetch their own data to avoid unnecessary API calls
  }, []);

  const handleNavigate = (path) => {
    router.push(path);
  };

  const handleLogin = (token, user) => {
    setToken(token);
    localStorage.setItem('isAdmin', user.role === 'admin' ? 'true' : 'false');
    localStorage.setItem('username', user.username);
    setIsLoggedIn(true);
    setUsername(user.username);
    setIsAdmin(user.role === 'admin');
    router.push('/');
  };

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUsername('');
    router.push('/');
  };

  return (
    <>
      <Navigation
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        username={username}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <Component
        {...pageProps}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        username={username}
        appState={appState}
        onNavigate={handleNavigate}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </>
  );
}

export default MyApp;
