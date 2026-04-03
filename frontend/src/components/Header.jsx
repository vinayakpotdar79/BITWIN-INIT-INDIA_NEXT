// src/components/Header.jsx - UPDATED WITH DEEPFAKE TAB
import React, { useState } from "react";
import { LogOut, Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Header({
  activeTab,
  setActiveTab,
  isAuthenticated,
  user,
  onLogout,
  onLoginClick,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const tabs = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "features", label: "Features" },
    ...(isAuthenticated ? [{ id: "inbox", label: "Inbox" }] : []),
    { id: "deepfake", label: "Deep Fake" },
    { id: "cyberawareness", label: "Cyber Awareness" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 border-purple-800/30"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 group">
            <h1
              className={`text-2xl font-bold bg-gradient-to-r transition-all duration-300 bg-clip-text text-transparent ${
                isDark
                  ? "from-purple-400 to-pink-400 group-hover:from-purple-300 group-hover:to-pink-300"
                  : "from-purple-600 to-pink-600 group-hover:from-purple-500 group-hover:to-pink-500"
              }`}
            >
              KavachX
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8 items-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative text-base font-medium transition-all duration-300 pb-1 group ${
                  activeTab === tab.id
                    ? isDark
                      ? "text-white"
                      : "text-gray-900"
                    : isDark
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
                <span
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-300 ${
                    activeTab === tab.id ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </button>
            ))}
          </nav>

          {/* Auth & Theme Section */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-300 border ${
                isDark
                  ? "text-gray-300 hover:text-white hover:bg-white/10 border-transparent hover:border-white/20"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent hover:border-gray-200"
              }`}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {isAuthenticated ? (
              <>
                <div
                  className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300 border ${
                    isDark
                      ? "bg-white/10 border-white/20 hover:bg-white/20 hover:shadow-lg hover:shadow-purple-500/20"
                      : "bg-gray-100 border-gray-200 hover:bg-gray-200 hover:shadow-lg hover:shadow-gray-400/40"
                  }`}
                >
                  {user?.picture && (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-purple-400"
                    />
                  )}
                  <span
                    className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {user?.name || "User"}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 border group ${
                    isDark
                      ? "text-gray-300 hover:text-white hover:bg-white/10 border-white/20 hover:shadow-lg hover:shadow-purple-500/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-200 hover:shadow-lg hover:shadow-gray-400/40"
                  }`}
                >
                  <LogOut className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 hover:-translate-y-0.5"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isDark
                  ? "text-gray-300 hover:text-white hover:bg-white/10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 transition-colors ${
                isDark
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className={`md:hidden pb-4 space-y-4 border-t transition-colors duration-300 pt-4 ${
              isDark ? "border-purple-800/30" : "border-gray-200"
            }`}
          >
            <nav className="flex flex-col gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium"
                      : isDark
                        ? "text-gray-300 hover:bg-white/10"
                        : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {!isAuthenticated && (
              <button
                onClick={() => {
                  onLoginClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
