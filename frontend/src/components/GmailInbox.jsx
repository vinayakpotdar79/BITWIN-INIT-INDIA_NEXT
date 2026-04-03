import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  RefreshCw,
  Eye,
  LogOut,
  Zap,
  Mail,
  Shield,
  AlertTriangle,
  CheckCircle,
  ClosedCaption,
  LucideShieldClose,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function GmailInbox({
  isAuthenticated,
  emails,
  loading,
  error,
  onConnect,
  onRefresh,
  onLogout,
  onStartWatch,
}) {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleStartWatch = () => {
    setIsWatching(true);
    onStartWatch();
  };

  return (
    <section
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${
        isDark
          ? "bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950"
          : "bg-gradient-to-br from-white via-gray-50 to-white"
      }`}
    >
      {/* Animated Background Blobs - Dark Mode Only */}
      {isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
          <div
            className="absolute top-1/3 -right-40 w-96 h-96 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-600 to-pink-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>
      )}

      {/* Grid Background - Dark Mode Only */}
      {isDark && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        ></div>
      )}

      {/* Gradient Overlay - Dark Mode Only */}
      {isDark && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent pointer-events-none"></div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Header Badge - Animate In */}
        <div
          className={`flex justify-center mb-8 transition-all duration-1000 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 backdrop-blur-md border rounded-full transition-all duration-300 cursor-pointer group ${
              isDark
                ? "bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/40"
                : "bg-gray-100 hover:bg-gray-200 border-gray-300 hover:border-gray-400"
            }`}
          >
            <Mail
              className={`w-4 h-4 animate-pulse ${isDark ? "text-purple-300" : "text-purple-600"}`}
            />
            <span
              className={`text-sm font-medium bg-clip-text text-transparent ${
                isDark
                  ? "bg-gradient-to-r from-purple-200 to-pink-200"
                  : "bg-gradient-to-r from-purple-600 to-pink-600"
              }`}
            >
              Real-time Email Monitoring
            </span>
            <ArrowRight
              className={`w-4 h-4 group-hover:translate-x-1 transition-transform duration-300 ${isDark ? "text-purple-300" : "text-purple-600"}`}
            />
          </div>
        </div>

        {/* Main Heading - Animate In */}
        <div
          className={`text-center mb-6 transition-all duration-1000 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
            <span
              className={`block drop-shadow-lg ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Your Gmail
            </span>
            <span className="block relative inline-block mt-2">
              {isDark && (
                <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-40 animate-pulse rounded-lg"></span>
              )}
              <span
                className={`relative bg-clip-text text-transparent drop-shadow-2xl transition-all duration-300 ${
                  isDark
                    ? "bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 hover:from-purple-200 hover:via-pink-200 hover:to-blue-200"
                    : "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500"
                }`}
              >
                Inbox Reimagined
              </span>
            </span>
          </h1>
        </div>

        {/* Description - Animate In */}
        <div
          className={`max-w-2xl mx-auto mb-12 transition-all duration-1000 transform delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p
            className={`text-lg md:text-xl mb-8 leading-relaxed drop-shadow-md text-center ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Monitor your emails in real-time. Get instant notifications as new
            messages arrive with our advanced AI polling system.
          </p>
          <div
            className={`flex flex-wrap justify-center gap-6 text-sm ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <div className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-300">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${isDark ? "bg-purple-400" : "bg-purple-600"}`}
              ></div>
              <span>Real-time Updates</span>
            </div>
            <div className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-300">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${isDark ? "bg-pink-400" : "bg-pink-600"}`}
                style={{ animationDelay: "0.5s" }}
              ></div>
              <span>Live Notifications</span>
            </div>
            <div className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-300">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${isDark ? "bg-blue-400" : "bg-blue-600"}`}
                style={{ animationDelay: "1s" }}
              ></div>
              <span>Always Connected</span>
            </div>
          </div>
        </div>

        {/* Error Alert - Animate In */}
        {error && (
          <div
            className={`max-w-2xl mx-auto mb-12 transition-all duration-500 transform ${
              error ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div
              className={`p-5 backdrop-blur-md border rounded-2xl flex items-start gap-4 transition-all duration-300 ${
                isDark
                  ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 hover:border-red-500/50"
                  : "bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300"
              }`}
            >
              <AlertTriangle
                className={`w-6 h-6 flex-shrink-0 ${isDark ? "text-red-400" : "text-red-600"}`}
              />
              <div>
                <h3
                  className={`font-bold text-lg mb-1 ${isDark ? "text-red-300" : "text-red-700"}`}
                >
                  Error
                </h3>
                <p
                  className={`text-sm ${isDark ? "text-red-200" : "text-red-600"}`}
                >
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {!isAuthenticated ? (
          <>
            {/* CTA Button - Animate In */}
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-1000 transform delay-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <button
                onClick={onConnect}
                className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl overflow-hidden shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center gap-3 text-lg">
                  <Zap className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  Connect Gmail Account
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>

            {/* Empty State - Animate In */}
            <div
              className={`flex items-center justify-center min-h-[400px] transition-all duration-1000 transform delay-500 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div
                className={`text-center max-w-lg p-10 rounded-3xl border backdrop-blur-lg transition-all duration-300 ${
                  isDark
                    ? "bg-white/5 border-white/10 hover:border-purple-500/30"
                    : "bg-white border-gray-200 hover:border-purple-300 shadow-xl"
                }`}
              >
                <div
                  className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 border transition-all duration-500 group ${
                    isDark
                      ? "bg-purple-500/20 border-purple-500/30 group-hover:rotate-12"
                      : "bg-purple-50 border-purple-200 group-hover:rotate-12 shadow-inner"
                  }`}
                >
                  <Mail
                    className={`w-12 h-12 transition-all duration-300 ${isDark ? "text-purple-400" : "text-purple-600"}`}
                  />
                </div>
                <h2
                  className={`text-3xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Connect Your Inbox
                </h2>
                <p
                  className={`text-lg leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Experience full protection. Connect your Gmail to enable
                  real-time threat detection and advanced email analysis.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Action Buttons - Animate In */}
            <div
              className={`flex flex-wrap gap-4 justify-center mb-12 transition-all duration-1000 transform delay-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <button
                onClick={onRefresh}
                disabled={loading}
                className={`group relative px-6 py-4 font-bold rounded-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 flex items-center gap-3 border ${
                  isDark
                    ? "bg-white/10 hover:bg-white/20 border-white/10 hover:border-purple-500/50 text-white"
                    : "bg-white hover:bg-gray-50 border-gray-200 hover:border-purple-400 text-gray-900 shadow-sm"
                }`}
              >
                <RefreshCw
                  className={`w-5 h-5 transition-transform duration-700 ${loading ? "animate-spin" : "group-hover:rotate-180"}`}
                />
                Refresh Inbox
              </button>

              <button
                onClick={onLogout}
                className={`group relative px-6 py-4 font-bold rounded-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 border ${
                  isDark
                    ? "bg-white/10 hover:bg-red-500/20 border-white/10 hover:border-red-500/50 text-white hover:text-red-300"
                    : "bg-white hover:bg-red-50 border-gray-200 hover:border-red-400 text-gray-900 hover:text-red-700 shadow-sm"
                }`}
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Disconnect
              </button>
            </div>

            {/* Emails List - Animate In */}
            <div
              className={`max-w-4xl mx-auto transition-all duration-1000 transform delay-500 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              {loading && emails.length === 0 ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-32 rounded-2xl backdrop-blur-md animate-pulse border ${
                        isDark
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-100 border-gray-200"
                      }`}
                    ></div>
                  ))}
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-24 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 transition-all duration-500 hover:border-purple-500/20">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border transition-all duration-500 group-hover:scale-110 ${
                      isDark
                        ? "bg-white/5 border-white/10"
                        : "bg-gray-50 border-gray-200 shadow-inner"
                    }`}
                  >
                    <Mail
                      className={`w-10 h-10 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    />
                  </div>
                  <h3
                    className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    No Messages Yet
                  </h3>
                  <p
                    className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Your inbox is clean. Try refreshing to check for updates.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {emails.map((email, index) => (
                    <article
                      key={email.id}
                      onClick={() =>
                        setSelectedEmail(
                          selectedEmail?.id === email.id ? null : email,
                        )
                      }
                      className={`group relative rounded-2xl p-6 cursor-pointer transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl backdrop-blur-md overflow-hidden border
                        ${
                          selectedEmail?.id === email.id
                            ? isDark
                              ? "ring-2 ring-purple-500/50 bg-white/15 border-purple-500/40 shadow-purple-500/10"
                              : "ring-2 ring-purple-400 bg-white border-purple-300 shadow-purple-200 shadow-xl"
                            : isDark
                              ? "bg-white/5 hover:bg-white/10 border-white/10 hover:border-purple-500/40 hover:shadow-purple-500/10"
                              : "bg-white hover:bg-gray-50 border-gray-200 hover:border-purple-300 hover:shadow-purple-100"
                        }`}
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none"></div>

                      <div className="relative space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {email.isSpam && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                  Spam
                                </span>
                              )}
                              {email.prediction && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    email.prediction.prediction?.toLowerCase() ===
                                      "phishing_email" ||
                                    email.prediction.is_phishing
                                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                                  }`}
                                >
                                  {email.prediction.is_phishing
                                    ? "Phishing"
                                    : email.prediction.prediction ===
                                        "legitimate_email"
                                      ? "Clean"
                                      : email.prediction.prediction || "Clean"}
                                </span>
                              )}
                              {email.prediction && (
                                <span
                                  className={`text-xs font-bold leading-none ${isDark ? "text-purple-300/80" : "text-purple-600"}`}
                                >
                                  {Math.round(
                                    email.prediction.confidence * 100,
                                  )}
                                  % Confidence
                                </span>
                              )}
                            </div>
                            <h3
                              className={`text-lg md:text-xl font-bold truncate transition-colors duration-300 ${isDark ? "text-white group-hover:text-purple-300" : "text-gray-900 group-hover:text-purple-600"}`}
                            >
                              {email.subject || "(No Subject)"}
                            </h3>
                            <p
                              className={`text-sm mt-1 truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}
                            >
                              <span
                                className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
                              >
                                From:
                              </span>{" "}
                              {email.from}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <time
                              className={`text-xs font-medium px-2.5 py-1 rounded-lg ${isDark ? "text-gray-400 bg-white/5" : "text-gray-500 bg-gray-100"}`}
                            >
                              {new Date(email.timestamp).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </time>
                          </div>
                        </div>

                        {selectedEmail?.id === email.id ? (
                          <div className="pt-6 border-t border-white/10 space-y-6 animate-in slide-in-from-top-4 duration-500">
                            {email.reasoning && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <h4
                                      className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 ${isDark ? "text-purple-300" : "text-purple-600"}`}
                                    >
                                      <Zap className="w-3.5 h-3.5" /> AI
                                      Analysis Insight
                                    </h4>
                                    <div
                                      className={`text-sm leading-relaxed p-4 rounded-xl border ${isDark ? "text-gray-300 bg-white/5 border-white/5" : "text-gray-700 bg-gray-50 border-gray-100"}`}
                                    >
                                      {email.reasoning.explanation ||
                                        "Detailed analysis complete. No threats detected in this communication."}
                                    </div>
                                  </div>

                                  {email.reasoning.indicators &&
                                    email.reasoning.indicators.length > 0 && (
                                      <div>
                                        <h4
                                          className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDark ? "text-pink-300" : "text-pink-600"}`}
                                        >
                                          Key Indicators
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                          {email.reasoning.indicators.map(
                                            (indicator, i) => (
                                              <span
                                                key={i}
                                                className={`text-[10px] px-3 py-1.5 rounded-lg font-bold border ${isDark ? "bg-pink-500/10 text-pink-300 border-pink-500/20" : "bg-pink-50 text-pink-600 border-pink-100"}`}
                                              >
                                                {indicator}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <h4
                                      className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDark ? "text-blue-300" : "text-blue-600"}`}
                                    >
                                      Recommended Actions
                                    </h4>
                                    <ul className="space-y-3">
                                      {(
                                        email.reasoning.recommended_steps || [
                                          "Review the email carefully before clicking any links",
                                          "Verify the sender via a known trusted channel",
                                        ]
                                      ).map((step, i) => (
                                        <li
                                          key={i}
                                          className={`text-xs flex items-start gap-3 p-3 rounded-xl border ${isDark ? "text-gray-300 bg-blue-500/5 border-blue-500/10" : "text-gray-700 bg-blue-50 border-blue-100"}`}
                                        >
                                          <CheckCircle
                                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? "text-blue-400" : "text-blue-500"}`}
                                          />
                                          {step}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="pt-2">
                              <h4
                                className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                              >
                                Content Preview
                              </h4>
                              <div
                                className={`text-sm italic p-4 rounded-xl border font-mono ${isDark ? "text-gray-400 bg-black/30 border-white/5" : "text-gray-600 bg-gray-50 border-gray-100"}`}
                              >
                                "
                                {email.snippet ||
                                  "No preview content available for this message."}
                                "
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-4">
                              <button className="cursor-pointer text-sm px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1 flex items-center gap-2">
                                <LucideShieldClose className="w-5 h-5" />
                                Close
                              </button>
                              <button
                                className={`text-sm px-6 py-3 rounded-xl font-bold border transition-all duration-300 hover:-translate-y-1 ${isDark ? "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30" : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"}`}
                              >
                                Mark as Security Threat
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <p
                              className={`text-sm truncate flex-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                            >
                              {email.snippet || "No preview available"}
                            </p>
                            <span
                              className={`p-1.5 rounded-full transition-transform duration-300 group-hover:translate-x-1 ${isDark ? "bg-white/5" : "bg-gray-100"}`}
                            >
                              <ArrowRight
                                className={`w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                              />
                            </span>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slide-in-from-top-4 {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: slide-in-from-top-4 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Custom scrollbar for better dark mode feel */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${isDark ? "#020617" : "#f8fafc"};
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? "#334155" : "#cbd5e1"};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? "#475569" : "#94a3b8"};
        }
      `}</style>
    </section>
  );
}
