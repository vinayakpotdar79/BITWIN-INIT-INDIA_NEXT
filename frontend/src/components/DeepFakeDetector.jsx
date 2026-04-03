// src/components/DeepFakeDetector.jsx - UPDATED WITH REAL API SUPPORT
import React, { useState, useRef } from "react";
import { Upload, Loader, Image, Music } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import DeepFakeResult from "./Deepfakeresult"; // Fixed filename casing if necessary or kept as is

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

export default function DeepFakeDetector() {
  const { isDark } = useTheme();

  const toPercent = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return 0;
    return Math.min(100, Math.max(0, numeric * 100));
  };

  // Image Detection State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState(null);
  const imageInputRef = useRef(null);

  // Audio Detection State
  const [audioFile, setAudioFile] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioResult, setAudioResult] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const audioInputRef = useRef(null);

  // Error states
  const [imageError, setImageError] = useState(null);
  const [audioError, setAudioError] = useState(null);

  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    setImageError(null);
    setImageResult(null);

    if (file && file.type.startsWith("image/")) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageError("Please upload a valid image file");
    }
  };

  // Handle Audio Upload
  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    setAudioError(null);
    setAudioResult(null);

    if (
      file &&
      (file.type.startsWith("audio/") ||
        file.type === "application/octet-stream")
    ) {
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
    } else {
      setAudioError("Please upload a valid audio file");
    }
  };

  // Analyze Image with Real API
  const analyzeImage = async () => {
    if (!imageFile) return;

    setImageLoading(true);
    setImageError(null);
    setImageResult(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile); // Changed 'file' to 'image' to match backend imageRoutes.js

      const response = await fetch(`${API_URL}/predict-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Adjust to match the backend response format
      // If the backend returns { label: 'fake', confidence: 0.9 }
      setImageResult({
        prediction: data.label || (data.is_deepfake ? "Deepfake" : "Authentic"),
        confidence: data.confidence,
        is_deepfake: data.is_deepfake ?? data.label?.toLowerCase() === "fake",
      });
    } catch (error) {
      console.error("Image analysis error:", error);
      setImageError(
        error.message || "Failed to analyze image. Please try again.",
      );

      // Fallback for demo if API is not reachable
      /*
      setImageResult({
        prediction: 'Deepfake',
        confidence: 0.5236,
        is_deepfake: true
      });
      */
    } finally {
      setImageLoading(false);
    }
  };

  // Analyze Audio with Real API
  const analyzeAudio = async () => {
    if (!audioFile) return;

    setAudioLoading(true);
    setAudioError(null);
    setAudioResult(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      // Some deployments inspect `file`; keeping both keys makes upload resilient.
      // formData.append("file", audioFile);

      const response = await fetch(`${API_URL}/audio`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.error ||
            `Audio API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = payload?.data || {};
      const predictionData = data?.prediction || {};
      const rawPrediction = (predictionData?.prediction || "unknown")
        .toString()
        .toLowerCase();

      setAudioResult({
        prediction:
          rawPrediction === "fake"
            ? "Deepfake"
            : rawPrediction === "real"
              ? "Authentic"
              : rawPrediction,
        confidence: Number(predictionData?.confidence ?? 0),
        is_deepfake:
          typeof predictionData?.is_deepfake === "boolean"
            ? predictionData.is_deepfake
            : rawPrediction === "fake",
        all_scores: predictionData?.all_scores || null,
        filename: predictionData?.filename || audioFile.name,
        timestamp: data?.timestamp || null,
      });
    } catch (error) {
      console.error("Audio analysis error:", error);
      setAudioError(
        error.message || "Failed to analyze audio. Please try again.",
      );
    } finally {
      setAudioLoading(false);
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
            isDark ? "bg-red-600" : "bg-red-400"
          }`}
        ></div>
        <div
          className={`absolute top-1/3 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-10 ${
            isDark ? "bg-orange-600" : "bg-orange-400"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-10 ${
            isDark ? "bg-yellow-600" : "bg-yellow-400"
          }`}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1
            className={`text-5xl md:text-7xl font-bold mb-6 bg-linear-to-r ${
              isDark
                ? "from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent"
                : "from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent"
            }`}
          >
            DeepFake Detector
          </h1>
          <p
            className={`text-lg md:text-xl max-w-2xl mx-auto ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Advanced AI-powered detection for images and audio. Identify
            manipulated media with cutting-edge analysis.
          </p>
        </div>

        {/* Two Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* ===== IMAGE DEEPFAKE DETECTION ===== */}
          <div>
            <div
              className={`rounded-2xl transition-all duration-300 ${
                isDark
                  ? "bg-white/5 border border-white/10 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20"
                  : "bg-gray-100 border border-gray-200 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20"
              }`}
            >
              <div className="p-8">
                {/* Section Title */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-3 rounded-lg ${
                      isDark ? "bg-red-500/20" : "bg-red-100"
                    }`}
                  >
                    <Image
                      className={`w-6 h-6 ${
                        isDark ? "text-red-400" : "text-red-600"
                      }`}
                    />
                  </div>
                  <h2
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Image Analysis
                  </h2>
                </div>

                {/* Upload Area or Preview */}
                {!imageResult && (
                  <>
                    {!imagePreview ? (
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        className={`mb-6 p-8 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer group ${
                          isDark
                            ? "border-red-500/30 hover:border-red-500 hover:bg-red-500/10"
                            : "border-red-300 hover:border-red-500 hover:bg-red-50"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Upload
                            className={`w-12 h-12 transition-all duration-300 group-hover:scale-110 ${
                              isDark ? "text-red-400" : "text-red-600"
                            }`}
                          />
                          <div className="text-center">
                            <p
                              className={`font-semibold mb-1 ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Click to upload image
                            </p>
                            <p
                              className={`text-sm ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              or drag and drop
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 space-y-4">
                        <div
                          className={`rounded-lg overflow-hidden border ${
                            isDark ? "border-red-500/30" : "border-red-300"
                          }`}
                        >
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-64 object-cover"
                          />
                        </div>
                        <button
                          onClick={() => imageInputRef.current?.click()}
                          className={`w-full py-2 rounded-lg transition-all duration-300 ${
                            isDark
                              ? "bg-white/10 hover:bg-white/20 text-white"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                          }`}
                        >
                          Change Image
                        </button>
                      </div>
                    )}

                    {/* Error Message */}
                    {imageError && (
                      <div
                        className={`mb-6 p-4 rounded-lg border ${
                          isDark
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-red-50 border-red-300 text-red-600"
                        }`}
                      >
                        {imageError}
                      </div>
                    )}

                    {/* Analyze Button */}
                    <button
                      onClick={analyzeImage}
                      disabled={!imageFile || imageLoading}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                        imageLoading || !imageFile
                          ? isDark
                            ? "bg-red-500/30 text-gray-400 cursor-not-allowed"
                            : "bg-red-100 text-gray-400 cursor-not-allowed"
                          : isDark
                            ? "bg-linear-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white hover:shadow-lg hover:shadow-red-500/50"
                            : "bg-linear-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white hover:shadow-lg hover:shadow-red-500/50"
                      }`}
                    >
                      {imageLoading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Analyze Image"
                      )}
                    </button>
                  </>
                )}

                {/* Result Display */}
                {imageResult && (
                  <div className="space-y-4">
                    <DeepFakeResult result={imageResult} type="image" />
                    <button
                      onClick={() => {
                        setImageResult(null);
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                        isDark
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                      }`}
                    >
                      Analyze Another Image
                    </button>
                  </div>
                )}

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* ===== AUDIO DEEPFAKE DETECTION ===== */}
          <div>
            <div
              className={`rounded-2xl transition-all duration-300 ${
                isDark
                  ? "bg-white/5 border border-white/10 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20"
                  : "bg-gray-100 border border-gray-200 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20"
              }`}
            >
              <div className="p-8">
                {/* Section Title */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-3 rounded-lg ${
                      isDark ? "bg-orange-500/20" : "bg-orange-100"
                    }`}
                  >
                    <Music
                      className={`w-6 h-6 ${
                        isDark ? "text-orange-400" : "text-orange-600"
                      }`}
                    />
                  </div>
                  <h2
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Audio Analysis
                  </h2>
                </div>

                {/* Upload Area or Preview */}
                {!audioResult && (
                  <>
                    {!audioFile ? (
                      <div
                        onClick={() => audioInputRef.current?.click()}
                        className={`mb-6 p-8 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer group ${
                          isDark
                            ? "border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/10"
                            : "border-orange-300 hover:border-orange-500 hover:bg-orange-50"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Upload
                            className={`w-12 h-12 transition-all duration-300 group-hover:scale-110 ${
                              isDark ? "text-orange-400" : "text-orange-600"
                            }`}
                          />
                          <div className="text-center">
                            <p
                              className={`font-semibold mb-1 ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Click to upload audio
                            </p>
                            <p
                              className={`text-sm ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              or drag and drop
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 space-y-4">
                        <div
                          className={`p-4 rounded-lg border ${
                            isDark
                              ? "border-orange-500/30 bg-white/5"
                              : "border-orange-300 bg-orange-50"
                          }`}
                        >
                          <p
                            className={`text-sm font-semibold mb-2 ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {audioFile.name}
                          </p>
                          <audio
                            controls
                            src={audioPreview}
                            className="w-full"
                          />
                        </div>
                        <button
                          onClick={() => audioInputRef.current?.click()}
                          className={`w-full py-2 rounded-lg transition-all duration-300 ${
                            isDark
                              ? "bg-white/10 hover:bg-white/20 text-white"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                          }`}
                        >
                          Change Audio
                        </button>
                      </div>
                    )}

                    {/* Error Message */}
                    {audioError && (
                      <div
                        className={`mb-6 p-4 rounded-lg border ${
                          isDark
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-red-50 border-red-300 text-red-600"
                        }`}
                      >
                        {audioError}
                      </div>
                    )}

                    {/* Analyze Button */}
                    <button
                      onClick={analyzeAudio}
                      disabled={!audioFile || audioLoading}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                        audioLoading || !audioFile
                          ? isDark
                            ? "bg-orange-500/30 text-gray-400 cursor-not-allowed"
                            : "bg-orange-100 text-gray-400 cursor-not-allowed"
                          : isDark
                            ? "bg-linear-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white hover:shadow-lg hover:shadow-orange-500/50"
                            : "bg-linear-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white hover:shadow-lg hover:shadow-orange-500/50"
                      }`}
                    >
                      {audioLoading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Analyze Audio"
                      )}
                    </button>
                  </>
                )}

                {/* Result Display */}
                {audioResult && (
                  <div className="space-y-4">
                    <DeepFakeResult result={audioResult} type="audio" />

                    {audioResult.all_scores && (
                      <div
                        className={`rounded-xl border p-4 ${
                          isDark
                            ? "bg-white/5 border-white/10"
                            : "bg-gray-100 border-gray-200"
                        }`}
                      >
                        <h4
                          className={`text-sm font-bold mb-3 ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Audio Model Scores
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span
                                className={
                                  isDark ? "text-gray-300" : "text-gray-700"
                                }
                              >
                                Fake
                              </span>
                              <span
                                className={
                                  isDark ? "text-red-300" : "text-red-700"
                                }
                              >
                                {toPercent(audioResult.all_scores.fake).toFixed(
                                  2,
                                )}
                                %
                              </span>
                            </div>
                            <div
                              className={`h-2 rounded-full overflow-hidden ${
                                isDark ? "bg-white/10" : "bg-gray-200"
                              }`}
                            >
                              <div
                                className="h-full bg-linear-to-r from-red-500 to-orange-500"
                                style={{
                                  width: `${toPercent(audioResult.all_scores.fake)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span
                                className={
                                  isDark ? "text-gray-300" : "text-gray-700"
                                }
                              >
                                Real
                              </span>
                              <span
                                className={
                                  isDark ? "text-green-300" : "text-green-700"
                                }
                              >
                                {toPercent(audioResult.all_scores.real).toFixed(
                                  2,
                                )}
                                %
                              </span>
                            </div>
                            <div
                              className={`h-2 rounded-full overflow-hidden ${
                                isDark ? "bg-white/10" : "bg-gray-200"
                              }`}
                            >
                              <div
                                className="h-full bg-linear-to-r from-green-500 to-emerald-500"
                                style={{
                                  width: `${toPercent(audioResult.all_scores.real)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {audioResult.filename && (
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${
                                isDark
                                  ? "bg-white/10 text-gray-300"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              File: {audioResult.filename}
                            </span>
                          )}
                          {audioResult.timestamp && (
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${
                                isDark
                                  ? "bg-white/10 text-gray-300"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              Scanned:{" "}
                              {new Date(audioResult.timestamp).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setAudioResult(null);
                        setAudioPreview(null);
                        setAudioFile(null);
                      }}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                        isDark
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                      }`}
                    >
                      Analyze Another Audio
                    </button>
                  </div>
                )}

                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div
          className={`p-8 rounded-2xl border ${
            isDark
              ? "bg-white/5 border-white/10"
              : "bg-gray-100 border-gray-200"
          }`}
        >
          <h3
            className={`text-xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Upload Media",
                description: "Select an image or audio file to analyze",
              },
              {
                step: "2",
                title: "AI Analysis",
                description:
                  "Advanced algorithms examine facial features and audio patterns",
              },
              {
                step: "3",
                title: "Get Results",
                description:
                  "Receive instant detection results with confidence score",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg ${
                    isDark
                      ? "bg-linear-to-r from-red-500 to-orange-500 text-white"
                      : "bg-linear-to-r from-red-600 to-orange-600 text-white"
                  }`}
                >
                  {item.step}
                </div>
                <h4
                  className={`font-semibold mb-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {item.title}
                </h4>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
