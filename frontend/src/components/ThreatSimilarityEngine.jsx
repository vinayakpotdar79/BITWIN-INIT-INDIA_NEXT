import React, { useState } from "react";
import { Zap, Loader, AlertCircle, TrendingUp } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThreatSimilarityEngine() {
  const { isDark } = useTheme();

  const [threatText, setThreatText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const toPercent = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return 0;
    return Math.min(100, Math.max(0, numeric * 100));
  };

  const getRiskTheme = (riskLevel = "MEDIUM") => {
    const normalized = riskLevel.toUpperCase();
    if (normalized === "HIGH") {
      return {
        text: isDark ? "text-red-300" : "text-red-700",
        chip: isDark ? "bg-red-500/20" : "bg-red-100",
        bar: "from-red-500 to-orange-500",
      };
    }
    if (normalized === "LOW") {
      return {
        text: isDark ? "text-green-300" : "text-green-700",
        chip: isDark ? "bg-green-500/20" : "bg-green-100",
        bar: "from-green-500 to-emerald-500",
      };
    }
    return {
      text: isDark ? "text-yellow-300" : "text-yellow-700",
      chip: isDark ? "bg-yellow-500/20" : "bg-yellow-100",
      bar: "from-yellow-500 to-orange-500",
    };
  };

  const searchSimilarThreats = async (e) => {
    e.preventDefault();

    if (!threatText.trim()) {
      setError("Please enter threat information");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:2000";

    try {
      const response = await fetch(`${API_BASE_URL}/threat/threatAgent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: threatText }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || "Failed to analyze threat");
      }

      const result = data?.data || {};

      setResults({
        attackType: result?.attack_type || "Unknown",
        riskLevel: result?.risk_level || "MEDIUM",
        confidence: toPercent(result?.confidence),
        similarAttacks: result?.similar_attacks || [],
        indicators: result?.indicators || [],
        explanation: result?.explanation || "No explanation returned.",
        recommendedSteps: result?.recommended_steps || [],
        sources: result?.sources || [],
        timestamp: data?.meta?.timestamp || null,
        model: data?.meta?.model || "N/A",
      });
    } catch (err) {
      console.error("Threat similarity search error:", err);

      setError(`Analysis Error: ${err.message}`);

      setResults(null);
    } finally {
      setLoading(false);
    }
  };

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
            isDark ? "bg-yellow-600" : "bg-yellow-400"
          }`}
        ></div>
        <div
          className={`absolute top-1/3 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-10 ${
            isDark ? "bg-orange-600" : "bg-orange-400"
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
                isDark ? "bg-yellow-500/20" : "bg-yellow-100"
              }`}
            >
              <Zap
                className={`w-8 h-8 ${
                  isDark ? "text-yellow-400" : "text-yellow-600"
                }`}
              />
            </div>
          </div>
          <h1
            className={`text-5xl md:text-6xl font-bold mb-6 bg-linear-to-r ${
              isDark
                ? "from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent"
                : "from-yellow-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent"
            }`}
          >
            Threat Similarity Engine
          </h1>
          <p
            className={`text-lg md:text-xl max-w-2xl mx-auto ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Analyze an incident report, compare it against known attacks, and
            get clear remediation guidance in one response.
          </p>
        </div>

        {/* Analysis Card */}
        <div
          className={`rounded-2xl border transition-all duration-300 p-8 mb-8 ${
            isDark
              ? "bg-white/5 border-white/10 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20"
              : "bg-gray-100 border-gray-200 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20"
          }`}
        >
          {/* Input Form */}
          <form onSubmit={searchSimilarThreats} className="space-y-4">
            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Describe the Threat or Attack
              </label>
              <textarea
                placeholder="Enter details about the threat you want to compare against our database..."
                value={threatText}
                onChange={(e) => setThreatText(e.target.value)}
                rows={6}
                maxLength={5000}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 resize-none ${
                  isDark
                    ? "bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 focus:bg-white/20 focus:outline-none"
                    : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:bg-white focus:outline-none"
                }`}
              />
              <div
                className={`mt-2 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {threatText.length}/5000 characters
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !threatText.trim()}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                loading || !threatText.trim()
                  ? isDark
                    ? "bg-yellow-500/30 text-gray-400 cursor-not-allowed"
                    : "bg-yellow-100 text-gray-400 cursor-not-allowed"
                  : isDark
                    ? "bg-linear-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white hover:shadow-lg hover:shadow-yellow-500/50"
                    : "bg-linear-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white hover:shadow-lg hover:shadow-yellow-500/50"
              }`}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Searching Database...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Find Similar Threats
                </>
              )}
            </button>

            {error && (
              <div
                className={`p-4 rounded-lg border ${
                  isDark
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-red-50 border-red-300 text-red-600"
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </form>

          {/* Results Display */}
          {results && (
            <div
              className="mt-8 space-y-6 border-t pt-8"
              style={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
              }}
            >
              {/* Summary */}
              <div
                className={`p-6 rounded-lg ${
                  isDark ? "bg-white/5" : "bg-gray-200/50"
                }`}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p
                      className={`text-sm font-semibold uppercase ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Attack Type
                    </p>
                    <p
                      className={`text-3xl font-bold mt-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {results.attackType}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${getRiskTheme(results.riskLevel).chip} ${getRiskTheme(results.riskLevel).text}`}
                    >
                      {results.riskLevel} RISK
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        isDark
                          ? "bg-white/10 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Model: {results.model}
                    </span>
                    {results.timestamp && (
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          isDark
                            ? "bg-white/10 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {new Date(results.timestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <p
                      className={`text-sm font-semibold ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Confidence
                    </p>
                    <p
                      className={`font-bold ${getRiskTheme(results.riskLevel).text}`}
                    >
                      {results.confidence.toFixed(1)}%
                    </p>
                  </div>
                  <div
                    className={`h-2 rounded-full overflow-hidden ${
                      isDark ? "bg-white/10" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`h-full bg-linear-to-r ${getRiskTheme(results.riskLevel).bar}`}
                      style={{ width: `${results.confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div
                className={`p-6 rounded-lg border ${
                  isDark
                    ? "bg-white/5 border-white/10"
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Explanation
                </h3>
                <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  {results.explanation}
                </p>
              </div>

              {/* Similar Attacks + Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-6 rounded-lg border ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-gray-100 border-gray-200"
                  }`}
                >
                  <h3
                    className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Similar Attacks
                  </h3>
                  {results.similarAttacks.length > 0 ? (
                    <ul className="space-y-2">
                      {results.similarAttacks.map((item, idx) => (
                        <li
                          key={idx}
                          className={`text-sm px-3 py-2 rounded-lg ${
                            isDark
                              ? "bg-white/5 text-gray-300"
                              : "bg-gray-200/70 text-gray-700"
                          }`}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      No similar attacks returned.
                    </p>
                  )}
                </div>

                <div
                  className={`p-6 rounded-lg border ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-gray-100 border-gray-200"
                  }`}
                >
                  <h3
                    className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Indicators
                  </h3>
                  {results.indicators.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {results.indicators.map((indicator, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-3 py-1 rounded-full ${
                            isDark
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-yellow-200 text-yellow-800"
                          }`}
                        >
                          {indicator}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      No indicators returned.
                    </p>
                  )}
                </div>
              </div>

              {/* Recommended Steps */}
              <div
                className={`p-6 rounded-lg border ${
                  isDark
                    ? "bg-white/5 border-white/10"
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Recommended Steps
                </h3>
                {results.recommendedSteps.length > 0 ? (
                  <ol className="space-y-2">
                    {results.recommendedSteps.map((step, idx) => (
                      <li
                        key={idx}
                        className={`text-sm px-3 py-2 rounded-lg ${
                          isDark
                            ? "bg-white/5 text-gray-300"
                            : "bg-gray-200/70 text-gray-700"
                        }`}
                      >
                        {idx + 1}. {step}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    No recommended steps returned.
                  </p>
                )}
              </div>

              {/* Sources */}
              <div
                className={`p-6 rounded-lg border ${
                  isDark
                    ? "bg-white/5 border-white/10"
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                {/* <h3
                  className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Sources
                </h3>
                {results.sources.length > 0 ? (
                  <div className="space-y-2">
                    {results.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source}
                        target="_blank"
                        rel="noreferrer"
                        className={`block text-sm underline break-all ${
                          isDark
                            ? "text-yellow-300 hover:text-yellow-200"
                            : "text-yellow-700 hover:text-yellow-800"
                        }`}
                      >
                        {source}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    No source links returned.
                  </p>
                )} */}
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
            📚 Understanding Threat Patterns
          </h3>
          <ul
            className={`space-y-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            <li>
              ✓ Threat actors often reuse tactics and techniques across
              campaigns
            </li>
            <li>
              ✓ Similar patterns can indicate coordinated attacks or copying of
              methods
            </li>
            <li>
              ✓ Always prioritize immediate containment for high-risk incidents
            </li>
            <li>
              ✓ Understanding historical threats helps predict future attacks
            </li>
            <li>
              ✓ TTPs (Tactics, Techniques, Procedures) are key to threat
              analysis
            </li>
            <li>
              ✓ Higher similarity scores indicate more likely related threat
              actors
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
