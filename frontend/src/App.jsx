import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import About from './components/About';
import CyberAwareness from './components/CyberAwareness'; 
import GmailInbox from './components/GmailInbox';
import DeepFakeDetector from './components/DeepFakeDetector';
import io from 'socket.io-client';
import WebsiteDetector from './components/WebsiteDetector';
import AttackerIntentSimulation from './components/AttackerIntentSimulation';
import ThreatSimilarityEngine from './components/ThreatSimilarityEngine';
import ChatbotAgent from './components/ChatbotAgent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const socketRef = useRef(null);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/status`);
      const data = await res.json();
      const auth = Boolean(data.authenticated);
      setIsAuthenticated(auth);

      // When authenticated, show inbox by default
      if (auth) setActiveTab('home');
    } catch (err) {
      console.error('Failed to check auth status', err);
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
      console.error('Error fetching emails', err);
      setError(err.message || 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  const startWatch = async () => {
    try {
      console.log('🔔 Starting Gmail watch...');
      const res = await fetch(`${API_URL}/gmail/start-watch`, { method: 'POST' });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      console.log('✅ Gmail watch started successfully:', data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('❌ Failed to start watch:', err.message);
      setError(`Failed to start email watch: ${err.message}`);
      
      // Retry after 3 seconds
      console.log('🔄 Retrying in 3 seconds...');
      setTimeout(startWatch, 3000);
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
    setEmails([]);
    setError('');

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('✅ User authenticated, setting up Socket.io...');
    fetchLatestEmails();
    startWatch();

    if (!socketRef.current) {
      console.log(`🔌 Connecting to Socket.io at: ${API_URL}`);
      socketRef.current = io(API_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Socket.io CONNECTED! ID:', socketRef.current.id);
      });

      socketRef.current.on('disconnect', () => {
        console.log('❌ Socket.io DISCONNECTED');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Socket.io connection error:', error);
      });

      socketRef.current.on('new-email', (email) => {
        console.log('🎉 NEW EMAIL RECEIVED VIA SOCKET.IO!', email);
        setEmails((prev) => [email, ...prev]);
      });

      console.log('📡 Socket.io listeners registered');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAuthenticated={isAuthenticated}
        user={null}
        onLogout={handleLogout}
        onLoginClick={handleLoginClick}
      />

      <main>
        {activeTab === 'home' && <Hero setActiveTab={setActiveTab} />}

        {activeTab === 'inbox' && (
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
        )}

        {activeTab === 'features' && <Features setActiveTab={setActiveTab} />}
        {activeTab === 'about' && <About />}
        {activeTab === 'cyberawareness' && <CyberAwareness />}
        {activeTab === 'deepfake' && <DeepFakeDetector />}

        {/* ⭐ NEW: Security Feature Pages */}
        {activeTab === 'website-detector' && <WebsiteDetector />}
        {activeTab === 'attacker-intent' && <AttackerIntentSimulation />}
        {activeTab === 'threat-similarity' && <ThreatSimilarityEngine />}
        <ChatbotAgent />
      </main>
    </div>
  );
}