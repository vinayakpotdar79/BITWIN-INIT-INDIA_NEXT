import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader, Zap } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ChatbotAgent() {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hey there! 👋 I'm KavachMitra, your security assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:2000";

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/chatbot-ui`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputValue }),
      });

      const data = await response.json();

      let botText;

      if (data.error) {
        botText = `Error: ${data.error}`;
      } else if (data.topic && data.explanation) {
        const tips = Array.isArray(data.prevention_tips)
          ? data.prevention_tips.map((tip) => `- ${tip}`).join("\n")
          : data.prevention_tips;
        const resources = Array.isArray(data.resources)
          ? data.resources.map((r) => `- ${r}`).join("\n")
          : data.resources;

        botText = `Topic: ${data.topic}\n\nExplanation: ${data.explanation}\n\nPrevention Tips:\n${tips}\n\nResources:\n${resources}`;
      } else {
        botText =
          data.raw ||
          data.explanation ||
          "I'm sorry, I couldn't understand that. Please ask a cybersecurity question.";
      }

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        text: botText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 2,
        type: "bot",
        text: "Something went wrong contacting the chatbot server. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Chatbot fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderFormattedMessage = (text) => {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const withHeaders = escaped
      .replace(
        /^topic:\s*/gim,
        '<strong class="text-purple-600 text-base">Topic:</strong> ',
      )
      .replace(
        /^explanation:\s*/gim,
        '<strong class="text-purple-600 text-base">Explanation:</strong> ',
      )
      .replace(
        /^prevention tips:\s*/gim,
        '<strong class="text-purple-600 text-base">Prevention Tips:</strong> ',
      )
      .replace(
        /^resources:\s*/gim,
        '<strong class="text-purple-600 text-base">Resources:</strong> ',
      );

    const html = withHeaders
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");

    return (
      <div
        className="whitespace-pre-wrap text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95 ${
          isDark
            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/50 hover:shadow-lg hover:shadow-purple-500/50"
            : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/50 hover:shadow-lg hover:shadow-purple-500/50"
        }`}
        title="Open chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
            {/* Pulse animation indicator */}
            <span className="absolute inset-0 rounded-full bg-purple-500 opacity-0 group-hover:opacity-20 animate-pulse"></span>
          </>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 z-40 w-96 max-h-[600px] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            isDark
              ? "bg-gradient-to-b from-slate-900 to-slate-800 border border-white/10 shadow-purple-900/30"
              : "bg-gradient-to-b from-white to-gray-50 border border-gray-200 shadow-gray-400/30"
          }`}
        >
          {/* Header */}
          <div
            className={`relative overflow-hidden p-6 border-b ${
              isDark
                ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-white/10 backdrop-blur-md"
                : "bg-gradient-to-r from-purple-100 to-pink-100 border-gray-200 backdrop-blur-md"
            }`}
          >
            {/* Decorative gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-transparent to-pink-500/0 opacity-20"></div>

            <div className="relative z-10 flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  isDark
                    ? "bg-purple-500/30 border border-purple-400/30"
                    : "bg-purple-200 border border-purple-300"
                }`}
              >
                <Zap
                  className={`w-5 h-5 ${isDark ? "text-purple-300" : "text-purple-600"}`}
                />
              </div>
              <div>
                <h3
                  className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  KavachMitra
                </h3>
                <p
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Always online
                </p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div
            className={`flex-1 overflow-y-auto h-80 p-4 space-y-4 ${
              isDark ? "bg-slate-900/50" : "bg-white/50"
            }`}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl transition-all duration-300 ${
                    message.type === "user"
                      ? isDark
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none"
                      : isDark
                        ? "bg-white/10 border border-white/20 text-gray-100 rounded-bl-none"
                        : "bg-gray-200 border border-gray-300 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {message.type === "bot" ? (
                    renderFormattedMessage(message.text)
                  ) : (
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      message.type === "user"
                        ? "text-white/70"
                        : isDark
                          ? "text-gray-400"
                          : "text-gray-600"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className={`px-4 py-3 rounded-2xl rounded-bl-none ${
                    isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-gray-200 border border-gray-300"
                  }`}
                >
                  <div className="flex gap-2 items-center">
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        isDark ? "bg-purple-400" : "bg-purple-600"
                      }`}
                    ></div>
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        isDark ? "bg-purple-400" : "bg-purple-600"
                      }`}
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        isDark ? "bg-purple-400" : "bg-purple-600"
                      }`}
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className={`border-t p-4 ${
              isDark
                ? "border-white/10 bg-slate-800/50 backdrop-blur-md"
                : "border-gray-200 bg-gray-100/50 backdrop-blur-md"
            }`}
          >
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className={`flex-1 px-4 py-2.5 rounded-full transition-all duration-300 focus:outline-none text-sm ${
                  isDark
                    ? "bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-purple-500/50 focus:bg-white/20 disabled:opacity-50"
                    : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:bg-white disabled:opacity-50"
                }`}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isLoading || !inputValue.trim()
                    ? isDark
                      ? "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                      : "bg-gray-300 text-gray-400 cursor-not-allowed"
                    : isDark
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
                }`}
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Powered by note */}
            <p
              className={`text-xs mt-3 text-center ${
                isDark ? "text-gray-500" : "text-gray-600"
              }`}
            >
              Powered by KavachX Security AI
            </p>
          </div>
        </div>
      )}

      {/* Mobile Responsive Version */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
