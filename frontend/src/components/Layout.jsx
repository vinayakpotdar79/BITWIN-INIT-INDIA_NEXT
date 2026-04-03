import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ChatbotAgent from './ChatbotAgent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';

export default function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/status`);
      const data = await res.json();
      setIsAuthenticated(Boolean(data.authenticated));
      if (data.user) setUser(data.user);
    } catch (err) {
      console.error('Failed to check auth status', err);
    }
  };

  const handleLoginClick = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch (err) {
      console.error('Logout error', err);
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
        onLoginClick={handleLoginClick}
      />
      <Outlet context={{ isAuthenticated, user }} />
      <ChatbotAgent />
    </div>
  );
}
