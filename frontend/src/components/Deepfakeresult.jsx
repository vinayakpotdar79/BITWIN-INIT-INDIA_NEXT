// src/components/DeepFakeResult.jsx
import React from "react";
import { AlertCircle, CheckCircle, TrendingUp, BarChart3 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function DeepFakeResult({ result, type = "image" }) {
  const { isDark } = useTheme();

  if (!result) return null;

  const { prediction, confidence, is_deepfake } = result;
  const confidencePercentage = (confidence * 100).toFixed(1);
  const isDeepfake = is_deepfake || prediction === "Deepfake";

  // Determine color scheme based on result
  const getColorScheme = () => {
    if (isDeepfake) {
      return {
        bgColor: isDark ? "bg-red-500/10" : "bg-red-50",
        borderColor: isDark ? "border-red-500/30" : "border-red-300",
        textColor: isDark ? "text-red-400" : "text-red-600",
        accentColor: "from-red-500 to-orange-500",
        lightAccent: isDark ? "bg-red-500/20" : "bg-red-100",
        icon: AlertCircle,
        status: "DEEPFAKE DETECTED",
        statusSubtext:
          "This media appears to be artificially generated or manipulated",
      };
    } else {
      return {
        bgColor: isDark ? "bg-green-500/10" : "bg-green-50",
        borderColor: isDark ? "border-green-500/30" : "border-green-300",
        textColor: isDark ? "text-green-400" : "text-green-600",
        accentColor: "from-green-500 to-emerald-500",
        lightAccent: isDark ? "bg-green-500/20" : "bg-green-100",
        icon: CheckCircle,
        status: "AUTHENTIC MEDIA",
        statusSubtext:
          "This media appears to be genuine with no significant manipulation detected",
      };
    }
  };

  const colorScheme = getColorScheme();
  const Icon = colorScheme.icon;

  // Calculate the arc for circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (parseFloat(confidencePercentage) / 100) * circumference;

  return (
    <div
      className={`space-y-6 p-6 rounded-2xl border-2 transition-all duration-500 ${colorScheme.bgColor} ${colorScheme.borderColor}`}
    >
      {/* Main Result Card */}
      <div className="flex gap-6 items-start">
        {/* Circular Progress Indicator */}
        <div className="flex-shrink-0">
          <div className="relative w-32 h-32">
            {/* Background circle */}
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                strokeWidth="3"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={isDeepfake ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)"}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-3xl font-bold ${colorScheme.textColor}`}>
                {confidencePercentage}%
              </div>
              <div
                className={`text-xs font-semibold mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Confidence
              </div>
            </div>
          </div>
        </div>

        {/* Result Text */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-full ${colorScheme.lightAccent}`}>
              <Icon className={`w-6 h-6 ${colorScheme.textColor}`} />
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${colorScheme.textColor}`}>
                {colorScheme.status}
              </h3>
              <p
                className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {colorScheme.statusSubtext}
              </p>
            </div>
          </div>

          {/* Details Row */}
          <div
            className={`flex gap-4 pt-4 border-t ${isDark ? "border-white/10" : "border-gray-200"}`}
          >
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}
              >
                Media Type
              </p>
              <p
                className={`text-sm font-bold mt-1 capitalize ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {type}
              </p>
            </div>
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}
              >
                Prediction
              </p>
              <p className={`text-sm font-bold mt-1 ${colorScheme.textColor}`}>
                {prediction}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Metrics */}
      <div
        className={`grid grid-cols-3 gap-4 p-4 rounded-xl ${
          isDark ? "bg-white/5" : "bg-gray-100/50"
        }`}
      >
        {/* Authenticity Score */}
        <div className="text-center">
          <div
            className={`text-sm font-semibold uppercase tracking-wider mb-2 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Authenticity
          </div>
          <div
            className={`text-2xl font-bold ${
              !isDeepfake ? "text-green-500" : "text-gray-400"
            }`}
          >
            {isDeepfake
              ? (100 - parseFloat(confidencePercentage)).toFixed(1)
              : parseFloat(confidencePercentage).toFixed(1)}
            %
          </div>
          <div
            className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}
          >
            Real Content
          </div>
        </div>

        {/* Manipulation Score */}
        <div
          className="text-center border-l border-r"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          }}
        >
          <div
            className={`text-sm font-semibold uppercase tracking-wider mb-2 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Manipulation
          </div>
          <div
            className={`text-2xl font-bold ${
              isDeepfake ? "text-red-500" : "text-gray-400"
            }`}
          >
            {isDeepfake
              ? parseFloat(confidencePercentage).toFixed(1)
              : (100 - parseFloat(confidencePercentage)).toFixed(1)}
            %
          </div>
          <div
            className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}
          >
            Deepfake Risk
          </div>
        </div>

        {/* Confidence Level */}
        <div className="text-center">
          <div
            className={`text-sm font-semibold uppercase tracking-wider mb-2 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Reliability
          </div>
          <div
            className={`text-2xl font-bold ${
              parseFloat(confidencePercentage) > 70
                ? "text-blue-500"
                : "text-yellow-500"
            }`}
          >
            {parseFloat(confidencePercentage) > 70 ? "High" : "Medium"}
          </div>
          <div
            className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}
          >
            Analysis Quality
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p
            className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Detection Confidence
          </p>
          <p className={`text-sm font-bold ${colorScheme.textColor}`}>
            {confidencePercentage}%
          </p>
        </div>
        <div
          className={`h-3 rounded-full overflow-hidden ${
            isDark ? "bg-white/10" : "bg-gray-200"
          }`}
        >
          <div
            className={`h-full transition-all duration-1000 bg-gradient-to-r ${colorScheme.accentColor}`}
            style={{ width: `${confidencePercentage}%` }}
          />
        </div>
      </div>

      {/* Detailed Analysis Text */}
      <div
        className={`p-4 rounded-lg border ${
          isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex gap-3">
          <BarChart3
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colorScheme.textColor}`}
          />
          <div>
            <h4
              className={`font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Analysis Details
            </h4>
            <p
              className={`text-sm leading-relaxed ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {isDeepfake
                ? `The analysis has detected signs of artificial manipulation or deepfake technology with ${confidencePercentage}% confidence. The media exhibits characteristics typical of AI-generated or heavily manipulated content. Extreme caution is recommended when sharing or relying on this media.`
                : `The analysis indicates this media is likely authentic with ${confidencePercentage}% confidence. No significant signs of deepfake technology or artificial manipulation were detected. However, no analysis is 100% accurate, and extremely sophisticated deepfakes may still evade detection.`}
            </p>
          </div>
        </div>
      </div>

      {/* Warning/Info Banner */}
      <div
        className={`p-4 rounded-lg border ${
          isDeepfake
            ? isDark
              ? "bg-red-500/10 border-red-500/30"
              : "bg-red-50 border-red-300"
            : isDark
              ? "bg-blue-500/10 border-blue-500/30"
              : "bg-blue-50 border-blue-300"
        }`}
      >
        <p
          className={`text-sm font-semibold mb-1 ${
            isDeepfake
              ? colorScheme.textColor
              : isDark
                ? "text-blue-400"
                : "text-blue-600"
          }`}
        >
          {isDeepfake ? "⚠️ Important Notice" : "ℹ️ For Your Information"}
        </p>
        <p
          className={`text-sm leading-relaxed ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {isDeepfake
            ? "Share this analysis responsibly. This media may have been digitally altered and should not be trusted without additional verification from reliable sources."
            : "While this media appears authentic, always verify important information through multiple reliable sources before making decisions based on it."}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
            isDark
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-900"
          }`}
        >
          Save Report
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r ${
            colorScheme.accentColor
          } text-white hover:shadow-lg hover:shadow-${isDeepfake ? "red" : "green"}-500/50`}
        >
          Analyze Another
        </button>
      </div>
    </div>
  );
}
