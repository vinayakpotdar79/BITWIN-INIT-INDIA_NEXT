// src/components/WebsiteDetector.jsx
import React, { useState } from "react";
import {
  Globe,
  Loader,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function WebsiteDetector() {
  const { isDark } = useTheme();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const toPercent = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return 0;
    return Math.min(100, Math.max(0, numeric * 100));
  };

  const analyzeURL = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:2000";

    try {
      const response = await fetch(`${API_BASE_URL}/url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.error ||
            `API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = payload?.data || {};
      const prediction = data?.prediction || {};
      const rawScores = prediction?.raw_scores || {};

      const benignPercent = toPercent(rawScores?.benign);
      const phishingPercent = toPercent(rawScores?.phishing);
      const confidencePercent = toPercent(prediction?.confidence);

      const isMalicious =
        typeof prediction?.is_malicious === "boolean"
          ? prediction.is_malicious
          : (prediction?.prediction || "").toLowerCase() === "phishing";

      const normalizedLabel = (prediction?.prediction || "unknown").replace(
        /_/g,
        " ",
      );

      setResult({
        url: url,
        timestamp: data?.timestamp,
        label: normalizedLabel,
        confidence: confidencePercent,
        benignScore: benignPercent,
        phishingScore: phishingPercent,
        isSuspicious: isMalicious,
        verdict: isMalicious ? "MALICIOUS / PHISHING" : "LEGITIMATE",
        recommendation: isMalicious
          ? "Avoid visiting this website. Do not enter passwords or personal information."
          : "URL appears safe based on current model output. Continue with normal caution.",
      });
    } catch (err) {
      console.error("URL analysis error:", err);
      setError(`Analysis Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isSuspicious = result?.isSuspicious;
  const riskScore = parseFloat(result?.phishingScore || 0);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? "bg-linear-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-linear-to-br from-gray-50 via-white to-gray-100"
      }`}
    >
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-10 ${
            isDark ? "bg-blue-600" : "bg-blue-400"
          }`}
        ></div>
        <div
          className={`absolute top-1/3 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-10 ${
            isDark ? "bg-cyan-600" : "bg-cyan-400"
          }`}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-blue-500/20" : "bg-blue-100"
              }`}
            >
              <Globe
                className={`w-8 h-8 ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}
              />
            </div>
          </div>
          <h1
            className={`text-5xl md:text-6xl font-bold mb-6 bg-linear-to-r ${
              isDark
                ? "from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
                : "from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent"
            }`}
          >
            Website Detector
          </h1>
          <p
            className={`text-lg md:text-xl max-w-2xl mx-auto ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Real-time URL intelligence powered by your backend model. Get clear
            legitimacy verdicts, confidence signals, and phishing probability.
          </p>
        </div>

        {/* Analysis Card */}
        <div
          className={`rounded-2xl border transition-all duration-300 p-8 mb-8 ${
            isDark
              ? "bg-white/5 border-white/10 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
              : "bg-gray-100 border-gray-200 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
          }`}
        >
          {/* Input Form */}
          <form onSubmit={analyzeURL} className="space-y-4">
            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Enter Website URL To Scan
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/login"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isDark
                      ? "bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-white/20 focus:outline-none"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none"
                  }`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                    loading
                      ? isDark
                        ? "bg-blue-500/30 text-gray-400 cursor-not-allowed"
                        : "bg-blue-100 text-gray-400 cursor-not-allowed"
                      : isDark
                        ? "bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/50"
                        : "bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/50"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze"
                  )}
                </button>
              </div>
              <p
                className={`mt-2 text-xs ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Example: https://github.com/Nikhil-2x
              </p>
            </div>

            {error && (
              <div
                className={`p-4 rounded-lg border ${
                  isDark
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-red-50 border-red-300 text-red-600"
                }`}
              >
                {error}
              </div>
            )}
          </form>

          {/* Result Display */}
          {result && (
            <div
              className="mt-8 space-y-6 border-t pt-8"
              style={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
              }}
            >
              {/* Risk Score */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Phishing Risk
                  </h3>
                  <span
                    className={`text-3xl font-bold ${
                      isSuspicious ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {riskScore.toFixed(2)}%
                  </span>
                </div>
                <div
                  className={`h-2 rounded-full overflow-hidden ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`h-full transition-all duration-1000 ${
                      isSuspicious
                        ? "bg-linear-to-r from-red-500 to-orange-500"
                        : "bg-linear-to-r from-green-500 to-emerald-500"
                    }`}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
              </div>

              {/* Model Confidence */}
              <div
                className={`rounded-lg border p-4 ${
                  isDark
                    ? "bg-white/5 border-white/10"
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      className={`w-5 h-5 ${
                        isDark ? "text-cyan-400" : "text-cyan-600"
                      }`}
                    />
                    <p
                      className={`font-semibold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Model Confidence
                    </p>
                  </div>
                  <span
                    className={`font-bold ${
                      isDark ? "text-cyan-300" : "text-cyan-700"
                    }`}
                  >
                    {result.confidence.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Verdict */}
              <div
                className={`p-6 rounded-lg border ${
                  isSuspicious
                    ? isDark
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-red-50 border-red-300"
                    : isDark
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-green-50 border-green-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  {isSuspicious ? (
                    <AlertCircle
                      className={`w-6 h-6 shrink-0 ${
                        isDark ? "text-red-400" : "text-red-600"
                      }`}
                    />
                  ) : (
                    <CheckCircle
                      className={`w-6 h-6 shrink-0 ${
                        isDark ? "text-green-400" : "text-green-600"
                      }`}
                    />
                  )}
                  <div className="flex-1">
                    <h4
                      className={`font-bold text-lg mb-2 ${
                        isSuspicious
                          ? isDark
                            ? "text-red-400"
                            : "text-red-600"
                          : isDark
                            ? "text-green-400"
                            : "text-green-600"
                      }`}
                    >
                      {result.verdict}
                    </h4>
                    <p
                      className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {result.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div
                className={`rounded-lg border p-5 ${
                  isDark
                    ? "bg-white/5 border-white/10"
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                <h4
                  className={`font-bold mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Class Score Breakdown
                </h4>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span
                        className={isDark ? "text-gray-300" : "text-gray-700"}
                      >
                        Benign
                      </span>
                      <span
                        className={isDark ? "text-green-300" : "text-green-700"}
                      >
                        {result.benignScore.toFixed(4)}%
                      </span>
                    </div>
                    <div
                      className={`h-2 rounded-full overflow-hidden ${
                        isDark ? "bg-white/10" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className="h-full bg-linear-to-r from-green-500 to-emerald-500"
                        style={{ width: `${result.benignScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span
                        className={isDark ? "text-gray-300" : "text-gray-700"}
                      >
                        Phishing
                      </span>
                      <span
                        className={isDark ? "text-red-300" : "text-red-700"}
                      >
                        {result.phishingScore.toFixed(4)}%
                      </span>
                    </div>
                    <div
                      className={`h-2 rounded-full overflow-hidden ${
                        isDark ? "bg-white/10" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className="h-full bg-linear-to-r from-red-500 to-orange-500"
                        style={{ width: `${result.phishingScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Info */}
              <div
                className={`p-4 rounded-lg ${
                  isDark ? "bg-white/5" : "bg-gray-200/50"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase mb-2 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Analyzed URL
                </p>
                <p
                  className={`break-all font-mono text-sm ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {result.url}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      isSuspicious
                        ? isDark
                          ? "bg-red-500/20 text-red-300"
                          : "bg-red-100 text-red-700"
                        : isDark
                          ? "bg-green-500/20 text-green-300"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {result.label}
                  </span>

                  {result.timestamp && (
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        isDark
                          ? "bg-white/10 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Scanned: {new Date(result.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div
          className={`rounded-2xl border p-8 ${
            isDark
              ? "bg-white/5 border-white/10"
              : "bg-gray-100 border-gray-200"
          }`}
        >
          <h3
            className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            🛡️ Safe Browsing Tips
          </h3>
          <ul
            className={`space-y-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            <li>
              ✓ Always check for HTTPS (secure) connection before entering
              sensitive information
            </li>
            <li>
              ✓ Be cautious of URLs with unusual characters or misspelled domain
              names
            </li>
            <li>✓ Verify the domain carefully before signing in</li>
            <li>✓ Hover over links to see the actual URL before clicking</li>
            <li>✓ Never click links from suspicious emails or messages</li>
            <li>✓ Use this tool to verify URLs before visiting them</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
