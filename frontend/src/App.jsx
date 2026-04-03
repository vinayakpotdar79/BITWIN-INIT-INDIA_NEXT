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
  );
}
