import React from 'react';
import { Globe, AlertTriangle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Features() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const features = [
    {
      id: 1,
      title: 'Suspicious Website Detector',
      description: 'Analyze URLs in real-time to detect phishing, malware, and suspicious websites. Get instant threat assessment before visiting any link.',
      icon: Globe,
      gradient: 'from-blue-500 to-cyan-500',
      path: '/website-detector',
      color: 'blue'
    },
    {
      id: 2,
      title: 'Attacker Intent Simulation',
      description: 'Analyze emails and messages to identify phishing attempts, social engineering, and malicious intent. Understand attack patterns and protect yourself.',
      icon: AlertTriangle,
      gradient: 'from-red-500 to-orange-500',
      path: '/attacker-intent',
      color: 'red'
    },
    {
      id: 3,
      title: 'Threat Similarity Engine',
      description: 'Compare threats against our database of known attacks. Identify similar patterns and learn from previous security incidents to stay ahead.',
      icon: Zap,
      gradient: 'from-yellow-500 to-orange-500',
      path: '/threat-similarity',
      color: 'yellow'
    }
  ];

  return (
    <section className={`relative py-20 md:py-32 overflow-hidden transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950'
        : 'bg-gradient-to-b from-white via-gray-50 to-white'
    }`}>
      {/* Background Blobs - Dark Mode Only */}
      {isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className={`inline-block mb-4 px-4 py-2 backdrop-blur-md rounded-full transition-colors duration-300 ${
            isDark
              ? 'bg-white/10 border border-white/20'
              : 'bg-gray-200 border border-gray-300'
          }`}>
            <span className={`text-sm font-medium bg-clip-text text-transparent ${
              isDark
                ? 'bg-gradient-to-r from-purple-300 to-pink-300'
                : 'bg-gradient-to-r from-purple-600 to-pink-600'
            }`}>
              Our Capabilities
            </span>
          </div>
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Advanced Security Tools
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
            Comprehensive threat detection and analysis tools to protect you from evolving cyber threats
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => navigate(feature.path)}
                className={`group relative p-8 rounded-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl text-left w-full cursor-pointer ${
                  isDark
                    ? 'bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 hover:shadow-purple-500/20'
                    : 'bg-gray-100 border border-gray-200 hover:border-gray-300 hover:bg-gray-200 hover:shadow-gray-500/20'
                }`}
                style={{
                  animation: `slideUp 0.6s ease-out ${index * 0.2}s both`,
                }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>

                {/* Icon Container */}
                <div className={`relative mb-6 w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className={`text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300 group-hover:bg-clip-text transition-all duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {feature.title}
                  </h3>
                  <p className={`leading-relaxed transition-colors duration-300 ${
                    isDark
                      ? 'text-gray-400 group-hover:text-gray-300'
                      : 'text-gray-700 group-hover:text-gray-800'
                  }`}>
                    {feature.description}
                  </p>

                  {/* Arrow Indicator */}
                  <div className={`mt-6 flex items-center gap-2 transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                    isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
                  }`}>
                    <span className="text-sm font-semibold">Explore</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Bottom Accent */}
                <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-full w-0 group-hover:w-full transition-all duration-300`}></div>
              </button>
            );
          })}
        </div>

        {/* Additional Info Section */}
        <div className={`mt-16 p-8 rounded-2xl border transition-colors duration-300 ${
          isDark
            ? 'bg-white/5 border-white/10 hover:border-white/20'
            : 'bg-gray-100 border-gray-200 hover:border-gray-300'
        }`}>
          <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Why Choose KavachX?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Real-Time Analysis',
                description: 'Get instant threat assessment and detailed reports on suspicious content'
              },
              {
                title: 'Threat Intelligence',
                description: 'Access our comprehensive database of known threats and attack patterns'
              },
              {
                title: 'Educational',
                description: 'Learn about cyber threats and how to protect yourself from attacks'
              }
            ].map((item, idx) => (
              <div key={idx}>
                <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.title}
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}