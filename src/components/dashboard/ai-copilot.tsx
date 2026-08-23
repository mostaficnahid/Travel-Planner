"use client";

import { useState, useEffect } from "react";
import { Sparkles, Send, Bot, User, RefreshCw, CheckCircle2, History } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionExecuted?: string | null;
}

interface Props {
  tripId: string;
  onTripUpdated?: () => void;
}

export function AICopilot({ tripId, onTripUpdated }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Load previous conversation from DB on mount
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const res = await fetch(`/api/ai/chat?tripId=${encodeURIComponent(tripId)}`);
        const data = await res.json();

        if (cancelled) return;

        if (data.success && data.data.messages.length > 0) {
          setConversationId(data.data.conversationId);
          setMessages(data.data.messages);
        } else {
          // No history — show the welcome message
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content:
                "Hello! I'm your VoyageAI Copilot. Ask me to optimize your daily route, find hotel alternatives, adjust budget spending, or adapt outdoor plans for rain! Your conversation is saved automatically.",
            },
          ]);
        }
      } catch {
        if (!cancelled) {
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: "Hello! I'm your VoyageAI Copilot. Ready to help plan your trip!",
            },
          ]);
        }
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    }

    loadHistory();
    return () => { cancelled = true; };
  }, [tripId]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          message: text,
          conversationId, // continue the same DB thread if already established
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Store conversation ID for subsequent messages
        if (data.data.conversationId && !conversationId) {
          setConversationId(data.data.conversationId);
        }

        const botReply: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.data.reply,
          actionExecuted: data.data.actionExecuted,
        };
        setMessages((prev) => [...prev, botReply]);

        if (data.data.actionExecuted) {
          onTripUpdated?.();
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Connection error. Check your network and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[620px] sm:h-[650px] text-white">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border-b border-white/10 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold">VoyageAI Copilot</h3>
            <p className="text-[11px] text-slate-400">Tool-Calling Assistant & Constraint Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversationId && (
            <span className="text-[10px] text-slate-500 font-mono hidden sm:flex items-center gap-1" title="Conversation history restored">
              <History className="w-3 h-3" />
              #{conversationId.slice(-6)}
            </span>
          )}
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
            Live Agent
          </span>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-3.5 px-4 bg-slate-950/60 border-b border-white/10 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        {[
          "⚡ Re-optimize daily routes",
          "🌧️ Move outdoor activities off rainy days",
          "💰 Analyze budget variance",
          "🏨 Search recommended hotels",
        ].map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 font-medium whitespace-nowrap hover:bg-blue-600 hover:text-white hover:border-blue-500 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* Loading skeleton while history fetches */}
        {isLoadingHistory ? (
          <div className="space-y-3 animate-pulse">
            {[80, 60, 72].map((w, i) => (
              <div key={i} className={`flex items-start gap-3 ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
                <div className="w-8 h-8 rounded-2xl bg-slate-800 shrink-0" />
                <div className={`h-10 rounded-2xl bg-slate-800`} style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Conversation restored chip */}
            {conversationId && messages.length > 1 && (
              <div className="flex items-center gap-2 justify-center">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] text-slate-500 font-medium px-2 flex items-center gap-1">
                  <History className="w-3 h-3" /> Conversation history restored
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            )}
            {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-2xl flex items-center justify-center text-xs shrink-0 ${
                m.role === "user" ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "bg-slate-800 text-blue-400 border border-white/10"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[84%] p-4 rounded-2xl text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none font-medium shadow-md"
                  : "bg-slate-950 text-slate-200 rounded-tl-none font-normal border border-white/10"
              }`}
            >
              {m.content}
              {m.actionExecuted && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Executed Tool: {m.actionExecuted}</span>
                </div>
              )}
            </div>
          </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium p-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>Reasoning over tools &amp; constraints...</span>
            </div>
          )}
          </>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-white/10 bg-slate-950/90 flex items-center gap-3">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask Copilot to edit or optimize trip..."
          className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputMsg.trim() || isLoading}
          className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl disabled:opacity-50 transition shadow-lg shadow-blue-500/20 border border-white/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
