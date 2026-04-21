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
      <div className="flex items-center justify-center min-h-[80vh] text-house-muted font-mono text-sm">
        Contestant not found.
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-house-border overflow-hidden">
          <Image src={contestant.portrait_url} alt={contestant.name} width={64} height={64} className="object-cover" onError={() => {}} />
        </div>
        <h2 className="font-bold text-lg">{contestant.name}</h2>
        <p className="text-house-muted text-sm max-w-sm">
          {contestant.name} isn&apos;t taking messages yet. Chat unlocks in Season 2.
        </p>
        <Link href={`/profile/${address}`} className="text-house-amber hover:underline text-sm">
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
      const errMsg = isDown
        ? "...[signal lost — backend offline]..."
        : "...[static]...";
      setMessages((m) => [...m, { role: "assistant", content: errMsg, timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-3.5rem)]">
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-house-border bg-house-bg/90 sticky top-14 backdrop-blur z-10">
        <div className="w-9 h-9 rounded-full bg-house-border overflow-hidden flex-shrink-0">
          <Image src={contestant.portrait_url} alt={contestant.name} width={36} height={36} className="object-cover" onError={() => {}} />
        </div>
        <div>
          <p className="font-semibold text-sm">{contestant.name}</p>
          <p className="font-mono text-xs text-house-chain">● memory active</p>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-house-muted text-xs font-mono pt-8">
            Start a conversation. She remembers.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-house-amber text-black rounded-br-sm"
                  : "bg-house-surface border border-house-border text-house-text rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-house-surface border border-house-border px-4 py-2.5 rounded-2xl rounded-bl-sm">
              <span className="inline-flex gap-1">
                {[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-house-muted animate-bounce" style={{animationDelay: `${i*0.15}s`}} />)}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="border-t border-house-border px-4 py-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={`Message ${contestant.name}...`}
          className="flex-1 bg-house-surface border border-house-border rounded-lg px-4 py-2.5 text-sm text-house-text placeholder:text-house-muted focus:outline-none focus:border-house-amber transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="p-2.5 bg-house-amber text-black rounded-lg hover:bg-house-amber/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <SendHorizonal size={16} />
        </button>
      </div>
    </div>
  );
}
