"use client";
import { useState, useRef, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { SendHorizonal } from "lucide-react";
import { getContestant } from "@/lib/contestants";
import { sendChatMessage, getUserId, isChatEnabled } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

interface Props { params: Promise<{ address: string }> }

const TICKER_COLORS: Record<string, string> = {
  MOM: "#F5C842", DAD: "#A855F7", GNSP: "#F59E0B", SHIB: "#FF6B2B",
  DOGE: "#C9A84C", PEPE: "#22c55e", FLOKI: "#60a5fa", PENGU: "#93c5fd",
  FARTCOIN: "#84cc16", PHNIX: "#f97316", PENKI: "#93c5fd",
  PHARTNIX: "#f97316", DOPE: "#22c55e", PHARKI: "#a78bfa",
};

export default function ChatPage({ params }: Props) {
  const { address } = use(params);
  const c       = getContestant(address);
  const enabled = isChatEnabled(address);
  const color   = TICKER_COLORS[c?.ticker ?? ""] ?? "#A855F7";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!c) return (
    <div className="flex items-center justify-center min-h-[80vh] font-mono text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
      Contestant not found.
    </div>
  );

  if (!enabled) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-6 text-center">
      <div className="relative rounded-2xl overflow-hidden" style={{ width: 80, height: 80, border: `2px solid ${color}33` }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }} />
        <Image src={c.portrait_url} alt={c.name} width={80} height={80} className="object-cover" onError={() => {}} />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.25em] uppercase font-mono mb-2" style={{ color: "#F5C842" }}>Not Available</p>
        <h2 className="font-display text-3xl text-white mb-2">{c.name}</h2>
        <p className="text-sm max-w-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          {c.name} isn&apos;t taking messages yet. Chat unlocks in Season 2.
        </p>
      </div>
      <Link href={`/profile/${address}`} className="text-sm hover:opacity-70 transition-opacity" style={{ color }}>
        ← Back to profile
      </Link>
    </div>
  );

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { response } = await sendChatMessage(address, userMsg.content, getUserId());
      setMessages(m => [...m, { role: "assistant", content: response, timestamp: new Date().toISOString() }]);
    } catch (err: unknown) {
      const isDown = err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"));
      setMessages(m => [...m, { role: "assistant", content: isDown ? "...[signal lost]..." : "...[static]...", timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-3.5rem)]">
      {/* header */}
      <div
        className="relative flex items-center gap-3 px-5 py-3 sticky top-14 z-10 overflow-hidden"
        style={{ background: "rgba(7,6,10,0.95)", borderBottom: `1px solid ${color}20` }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}44, transparent)` }} />
        <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 36, height: 36, border: `1.5px solid ${color}44` }}>
          <Image src={c.portrait_url} alt={c.name} width={36} height={36} className="object-cover" onError={() => {}} />
        </div>
        <div>
          <p className="font-semibold text-sm text-white">{c.name}</p>
          <p className="font-mono text-[10px]" style={{ color }}>● memory active</p>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 && (
          <p className="text-center font-mono text-xs pt-10" style={{ color: "rgba(255,255,255,0.2)" }}>
            Start a conversation. They remember.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={msg.role === "user" ? {
                background: `linear-gradient(135deg, ${color}cc, ${color}77)`,
                color: "#07060A",
                borderBottomRightRadius: 4,
              } : {
                background: "#0D0D14",
                border: `1px solid ${color}18`,
                color: "rgba(255,255,255,0.75)",
                borderBottomLeftRadius: 4,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl" style={{ background: "#0D0D14", border: `1px solid ${color}18`, borderBottomLeftRadius: 4 }}>
              <span className="inline-flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${i*0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="px-5 py-3 flex gap-2" style={{ borderTop: `1px solid ${color}18` }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={`Message ${c.name}...`}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors"
          style={{ background: "#0D0D14", border: `1px solid rgba(255,255,255,0.06)` }}
          onFocus={e => (e.target.style.borderColor = `${color}44`)}
          onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.06)")}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl transition-opacity disabled:opacity-25 disabled:cursor-not-allowed"
          style={{ background: color }}
        >
          <SendHorizonal size={16} color="#07060A" />
        </button>
      </div>
    </div>
  );
}
