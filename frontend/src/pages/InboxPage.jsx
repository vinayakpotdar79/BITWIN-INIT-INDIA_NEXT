import GmailInbox from '../components/GmailInbox';
import io from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';

export default function InboxPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/status`);
      const data = await res.json();
      setIsAuthenticated(Boolean(data.authenticated));
    } catch {
      console.error('Failed to check auth status');
    }
  };

  const fetchLatestEmails = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/gmail/latest`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load emails');
      }
      const data = await res.json();
      setEmails(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  const startWatch = async () => {
    try {
      await fetch(`${API_URL}/gmail/start-watch`, { method: 'POST' });
    } catch {
      setError('Failed to start email watch');
    }
  };

  const handleLoginClick = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch {
      console.error('Logout error');
    }
    setIsAuthenticated(false);
    setEmails([]);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLatestEmails();
    startWatch();

    if (!socketRef.current) {
      socketRef.current = io(API_URL);
      socketRef.current.on('new-email', (email) => {
        setEmails((prev) => [email, ...prev]);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]);

  return (
    <GmailInbox
      isAuthenticated={isAuthenticated}
      emails={emails}
      loading={loading}
      error={error}
      onConnect={handleLoginClick}
      onRefresh={fetchLatestEmails}
      onStartWatch={startWatch}
      onLogout={handleLogout}
    />
  );
}
