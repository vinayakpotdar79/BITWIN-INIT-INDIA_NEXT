import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import InboxPage from './pages/InboxPage';
import DeepFakePage from './pages/DeepFakePage';
import CyberAwarenessPage from './pages/CyberAwarenessPage';
import WebsiteDetectorPage from './pages/WebsiteDetectorPage';
import AttackerIntentPage from './pages/AttackerIntentPage';
import ThreatSimilarityPage from './pages/ThreatSimilarityPage';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="deepfake" element={<DeepFakePage />} />
            <Route path="cyberawareness" element={<CyberAwarenessPage />} />
            <Route path="website-detector" element={<WebsiteDetectorPage />} />
            <Route path="attacker-intent" element={<AttackerIntentPage />} />
            <Route path="threat-similarity" element={<ThreatSimilarityPage />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
import React, { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import About from "./components/About";
import CyberAwareness from "./components/CyberAwareness";
import GmailInbox from "./components/GmailInbox";
import DeepFakeDetector from "./components/DeepFakeDetector";
import io from "socket.io-client";
import WebsiteDetector from "./components/WebsiteDetector";
import AttackerIntentSimulation from "./components/AttackerIntentSimulation";
import ThreatSimilarityEngine from "./components/ThreatSimilarityEngine";
import ChatbotAgent from "./components/ChatbotAgent";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef(null);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/status`);
      const data = await res.json();
      const auth = Boolean(data.authenticated);
      setIsAuthenticated(auth);

      // When authenticated, show inbox by default
      if (auth) setActiveTab("inbox");
    } catch (err) {
      console.error("Failed to check auth status", err);
    }
  };

  const fetchLatestEmails = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/gmail/latest`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load emails");
      }
      const data = await res.json();
      setEmails(data);
    } catch (err) {
      console.error("Error fetching emails", err);
      setError(err.message || "Failed to fetch emails");
    } finally {
      setLoading(false);
    }
  };

  const startWatch = async () => {
    try {
      await fetch(`${API_URL}/gmail/start-watch`, { method: "POST" });
    } catch (err) {
      console.error("Failed to start watch", err);
      setError("Failed to start email watch");
    }
  };

  const handleLoginClick = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: "POST" });
    } catch (err) {
      console.error("Logout error", err);
    }

    setIsAuthenticated(false);
    setEmails([]);
    setError("");

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchLatestEmails();
    startWatch();

    if (!socketRef.current) {
      socketRef.current = io(API_URL);
      socketRef.current.on("new-email", (email) => {
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
        {activeTab === "home" && <Hero setActiveTab={setActiveTab} />}

        {activeTab === "inbox" && (
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

        {activeTab === "features" && <Features setActiveTab={setActiveTab} />}
        {activeTab === "about" && <About />}
        {activeTab === "cyberawareness" && <CyberAwareness />}
        {activeTab === "deepfake" && <DeepFakeDetector />}

        {/* ⭐ NEW: Security Feature Pages */}
        {activeTab === "website-detector" && <WebsiteDetector />}
        {activeTab === "attacker-intent" && <AttackerIntentSimulation />}
        {activeTab === "threat-similarity" && <ThreatSimilarityEngine />}
        <ChatbotAgent />
      </main>
    </div>
  );
}
