"use client";
import { useState, useRef, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { SendHorizonal } from "lucide-react";
import { getContestant } from "@/lib/contestants";
import { sendChatMessage, getUserId, isChatEnabled } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

interface Props {
  params: Promise<{ address: string }>;
}

const PURPLE = "#8B5CF6";
const BORDER = "rgba(139,92,246,0.2)";
const BORDER_SOFT = "rgba(255,255,255,0.07)";

export default function ChatPage({ params }: Props) {
  const { address } = use(params);
  const contestant = getContestant(address);
  const enabled    = isChatEnabled(address);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!contestant) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] font-mono text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
        Contestant not found.
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-6 text-center">
        <div
          className="w-20 h-20 rounded-2xl overflow-hidden"
          style={{ border: `2px solid ${BORDER}` }}
        >
          <Image src={contestant.portrait_url} alt={contestant.name} width={80} height={80} className="object-cover" onError={() => {}} />
        </div>
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase font-mono mb-2" style={{ color: PURPLE }}>
            Not Available
          </p>
          <h2 className="text-2xl font-bold text-white mb-2">{contestant.name}</h2>
          <p className="text-sm max-w-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            {contestant.name} isn&apos;t taking messages yet. Chat unlocks in Season 2.
          </p>
        </div>
        <Link
          href={`/profile/${address}`}
          className="text-sm transition-opacity hover:opacity-70"
          style={{ color: PURPLE }}
        >
          ← Back to profile
        </Link>
      </div>
    );
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const userId = getUserId();
      const { response } = await sendChatMessage(address, userMsg.content, userId);
      setMessages((m) => [...m, { role: "assistant", content: response, timestamp: new Date().toISOString() }]);
    } catch (err: unknown) {
      const isDown = err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"));
      setMessages((m) => [...m, { role: "assistant", content: isDown ? "...[signal lost — backend offline]..." : "...[static]...", timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-3.5rem)]">
      {/* header */}
      <div
        className="flex items-center gap-3 px-5 py-3 sticky top-14 backdrop-blur z-10"
        style={{
          background: "rgba(0,0,0,0.92)",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div
          className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
          style={{ border: `1.5px solid ${BORDER}` }}
        >
          <Image src={contestant.portrait_url} alt={contestant.name} width={36} height={36} className="object-cover" onError={() => {}} />
        </div>
        <div>
          <p className="font-semibold text-sm text-white">{contestant.name}</p>
          <p className="font-mono text-[10px]" style={{ color: PURPLE }}>● memory active</p>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 && (
          <p className="text-center font-mono text-xs pt-10" style={{ color: "rgba(255,255,255,0.25)" }}>
            Start a conversation. She remembers.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? {
                      background: `linear-gradient(135deg, #6B48A8, #9B7DD4)`,
                      color: "#fff",
                      borderBottomRightRadius: 4,
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${BORDER_SOFT}`,
                      color: "rgba(255,255,255,0.8)",
                      borderBottomLeftRadius: 4,
                    }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${BORDER_SOFT}`,
                borderBottomLeftRadius: 4,
              }}
            >
              <span className="inline-flex gap-1">
                {[0,1,2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: PURPLE, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div
        className="px-5 py-3 flex gap-2"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={`Message ${contestant.name}...`}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none transition-colors"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${BORDER_SOFT}`,
          }}
          onFocus={(e) => (e.target.style.borderColor = BORDER)}
          onBlur={(e) => (e.target.style.borderColor = BORDER_SOFT)}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: `linear-gradient(135deg, #6B48A8, #9B7DD4)` }}
        >
          <SendHorizonal size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
}
