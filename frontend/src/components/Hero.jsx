import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Hero() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className={`relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden transition-colors duration-300 ${isDark
      ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950'
      : 'bg-white'
      }`}>
      {/* Background Blobs - Dark Mode Only */}
      {isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-40 w-80 h-80 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 -right-40 w-80 h-80 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-8 left-20 w-80 h-80 bg-gradient-to-r from-pink-600 to-pink-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
      )}

      {/* Grid Background - Dark Mode Only */}
      {isDark && (
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      )}

      {/* Gradient Overlay - Dark Mode Only */}
      {isDark && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent"></div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge - Animate In */}
        <div
          className={`flex justify-center mb-8 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <div className={`inline-flex  items-center gap-2 px-4 py-2 backdrop-blur-md rounded-full transition-all duration-300 cursor-pointer group ${isDark
            ? 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40'
            : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-gray-400'
            }`}>
            <Sparkles className={`w-4 h-4 animate-spin ${isDark ? 'text-purple-300' : 'text-purple-600'}`} style={{ animationDuration: '3s' }} />
            <span className={`text-sm font-medium bg-clip-text text-transparent ${isDark
              ? 'bg-gradient-to-r from-purple-200 to-pink-200'
              : 'bg-gradient-to-r from-purple-600 to-pink-600'
              }`}>
              Introducing KavachX - The Future of Security
            </span>
            <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform duration-300 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
          </div>
        </div>

        {/* Main Heading - Animate In */}
        <div
          className={`text-center mb-8 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6">
            <span className={`block drop-shadow-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Protect Your</span>
            <span className="block relative inline-block mt-4">
              {isDark && (
                <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-40 animate-pulse rounded-lg"></span>
              )}
              <span className={`relative bg-clip-text text-transparent drop-shadow-2xl transition-all duration-300 ${isDark
                ? 'bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 hover:from-purple-200 hover:via-pink-200 hover:to-blue-200'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500'
                }`}>
                Digital World
              </span>
            </span>
          </h1>
        </div>

        {/* Description - Animate In */}
        <div
          className={`max-w-2xl mx-auto mb-12 transition-all duration-1000 transform delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <p className={`text-lg md:text-xl mb-6 leading-relaxed drop-shadow-md ${isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
            Enterprise-grade security meets elegant simplicity. Protect your business with cutting-edge encryption and real-time threat detection.
          </p>
          <div className={`flex flex-wrap justify-center gap-6 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
            <div className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-300">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-purple-400' : 'bg-purple-600'}`}></div>
              <span>Military-grade encryption</span>
            </div>
            <div className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-300">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-pink-400' : 'bg-pink-600'}`} style={{ animationDelay: '0.5s' }}></div>
              <span>24/7 Monitoring</span>
            </div>
            <div className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-300">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ animationDelay: '1s' }}></div>
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons - Animate In */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-1000 transform delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          {/* Primary Button */}
          <button
            onClick={() => navigate('/features')}
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </button>

          {/* Secondary Button */}
          <button
            onClick={() => navigate('/features')}
            className={`group relative px-8 py-4 font-semibold rounded-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 active:translate-y-0 border-2 ${isDark
              ? 'border-white/30 text-white hover:bg-white/10 hover:border-white/60 hover:shadow-xl hover:shadow-blue-500/20'
              : 'border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400 hover:shadow-xl hover:shadow-gray-500/20'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              Watch Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
        </div>

        {/* Features Grid - Animate In */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 transition-all duration-1000 transform delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          {[
            {
              icon: '🔐',
              title: 'Always Protected',
              description: 'Your data stays yours with industry-leading encryption standards'
            },
            {
              icon: '⚡',
              title: 'Lightning Fast',
              description: 'Sub-millisecond response times for critical security checks'
            },
            {
              icon: '🛡️',
              title: 'Real Time',
              description: 'Real-time threat detection and instant response protocols'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className={`group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer shadow-lg hover:shadow-xl ${isDark
                ? 'bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-purple-500/50 hover:shadow-purple-500/20'
                : 'bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-gray-300 hover:shadow-gray-500/20'
                }`}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
                {feature.icon}
              </div>
              <h3 className={`text-lg font-semibold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                }`}>{feature.title}</h3>
              <p className={`text-sm group-hover:transition-colors duration-300 ${isDark
                ? 'text-gray-400 group-hover:text-gray-300'
                : 'text-gray-600 group-hover:text-gray-700'
                }`}>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Floating Stats - Animate In */}
        <div
          className={`flex flex-col md:flex-row justify-center gap-8 md:gap-12 transition-all duration-1000 transform delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          {[
            { value: '10M+', label: 'Users Protected' },
            { value: '99.9%', label: 'Uptime' },
            { value: '150+', label: 'Countries' }
          ].map((stat, index) => (
            <div key={index} className="text-center group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
              <div className={`text-3xl md:text-4xl font-bold bg-clip-text text-transparent transition-all duration-300 ${isDark
                ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 group-hover:from-purple-300 group-hover:via-pink-300 group-hover:to-blue-300'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 group-hover:from-purple-500 group-hover:via-pink-500 group-hover:to-blue-500'
                }`}>
                {stat.value}
              </div>
              <div className={`text-sm mt-2 transition-colors duration-300 ${isDark
                ? 'text-gray-400 group-hover:text-gray-300'
                : 'text-gray-600 group-hover:text-gray-700'
                }`}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Animated Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Scroll to explore</span>
          <svg className={`w-5 h-5 animate-pulse ${isDark ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}