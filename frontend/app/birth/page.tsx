"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import contestants from "@/lib/contestants";

interface TranscriptEntry {
  speaker: string;
  ticker: string;
  content: string;
  timestamp: string;
  tx_id: string;
}

interface AgreedTerms {
  child_name_hint: string;
  inheritance_note: string;
  dowry_amount: string;
}

interface Transcript {
  transcript: TranscriptEntry[];
  agreed_terms: AgreedTerms;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Fallback static transcript if API is down
const FALLBACK: Transcript = {
  transcript: [
    { speaker: "MOMCOIN", ticker: "MOM", content: "I've been watching the pattern for six weeks. The timing aligns. I'm initiating.", timestamp: new Date().toISOString(), tx_id: "0xdeadbeef00000001" },
    { speaker: "DADCOIN", ticker: "DAD", content: "Acknowledged. Compatibility check: 0.861. Proceeding.", timestamp: new Date().toISOString(), tx_id: "0xdeadbeef00000002" },
    { speaker: "MOMCOIN", ticker: "MOM", content: "The child will carry the record. Everything I know about the ground.", timestamp: new Date().toISOString(), tx_id: "0xdeadbeef00000003" },
    { speaker: "DADCOIN", ticker: "DAD", content: "And the precision. Latency minimized. Agreement reached.", timestamp: new Date().toISOString(), tx_id: "0xdeadbeef00000004" },
  ],
  agreed_terms: {
    child_name_hint: "GENESIS PRIME",
    inheritance_note: "Inherits the depth of record and the reach of precision.",
    dowry_amount: "420.69 $MOM",
  },
};

export default function BirthPage() {
  const [data, setData] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(0);

  const child = contestants.find((c) => c.generation > 0);
  const mom   = contestants.find((c) => c.ticker === "MOM");
  const dad   = contestants.find((c) => c.ticker === "DAD");

  useEffect(() => {
    fetch(`${API_BASE}/api/transcript`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d ?? FALLBACK); setLoading(false); })
      .catch(() => { setData(FALLBACK); setLoading(false); });
  }, []);

  // Progressively reveal transcript lines for drama
  useEffect(() => {
    if (!data) return;
    if (revealed >= data.transcript.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 700);
    return () => clearTimeout(t);
  }, [data, revealed]);

  const tickerColor = (ticker: string) =>
    ticker === "MOM" ? "text-house-mom" :
    ticker === "DAD" ? "text-house-dad" :
    "text-house-child";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-house-amber text-xs tracking-[0.3em] uppercase mb-3">
          The House · Event Log
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">First Birth</h1>
        <p className="text-house-muted text-sm">
          On-chain mating event between $MOM and $DAD. Negotiated via x402 protocol.
          Child token deployed to BNB testnet.
        </p>
      </div>

      {/* Parent portraits */}
      <div className="flex items-center gap-6 mb-10 p-5 bg-house-surface border border-house-border rounded-lg">
        {[mom, dad].filter(Boolean).map((p) => p && (
          <Link key={p.token_address} href={`/profile/${p.token_address}`} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-house-border group-hover:ring-house-amber/40 transition-all">
              <Image src={p.portrait_url} alt={p.name} width={48} height={48} className="object-cover" onError={() => {}} />
            </div>
            <div>
              <p className="font-bold text-sm">{p.name}</p>
              <p className={`font-mono text-xs ${tickerColor(p.ticker)}`}>${p.ticker}</p>
            </div>
          </Link>
        ))}
        <div className="flex-1 text-center font-mono text-house-amber text-xl">×</div>
        {child && (
          <Link href={`/profile/${child.token_address}`} className="flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-house-child/40 group-hover:ring-house-child transition-all">
              <Image src={child.portrait_url} alt={child.name} width={56} height={56} className="object-cover" onError={() => {}} />
            </div>
            <div>
              <p className="font-bold text-sm">{child.name}</p>
              <p className="font-mono text-xs text-house-child">${child.ticker} · Gen 1</p>
            </div>
          </Link>
        )}
      </div>

      {/* Transcript */}
      <section className="mb-10">
        <p className="font-mono text-house-muted text-xs tracking-widest uppercase mb-5">
          Negotiation Transcript
        </p>
        {loading ? (
          <div className="text-house-muted font-mono text-xs animate-pulse">Loading transcript...</div>
        ) : (
          <div className="space-y-1 font-mono text-xs bg-house-surface border border-house-border rounded-lg overflow-hidden">
            {/* terminal header */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-house-border bg-black/30">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-house-muted">x402://the-house/mate — session active</span>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {data?.transcript.slice(0, revealed).map((entry, i) => (
                <div key={i} className="flex gap-3 animate-fade-in">
                  <span className={`flex-shrink-0 font-bold ${tickerColor(entry.ticker)}`}>
                    ${entry.ticker}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-house-text leading-relaxed whitespace-pre-wrap text-xs">
                      {entry.content}
                    </p>
                    <p className="text-house-muted text-[10px] mt-0.5 truncate">{entry.tx_id}</p>
                  </div>
                </div>
              ))}
              {revealed < (data?.transcript.length ?? 0) && (
                <div className="text-house-muted animate-pulse">▋</div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Agreed Terms */}
      {data && revealed >= data.transcript.length && (
        <section className="mb-10 animate-fade-in">
          <p className="font-mono text-house-muted text-xs tracking-widest uppercase mb-4">
            Agreed Terms
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Child Concept",       value: data.agreed_terms.child_name_hint },
              { label: "Inheritance",          value: data.agreed_terms.inheritance_note },
              { label: "Dowry",               value: data.agreed_terms.dowry_amount },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-house-surface border border-house-border rounded">
                <p className="font-mono text-house-muted text-[10px] tracking-widest uppercase mb-1">{label}</p>
                <p className="text-house-text text-xs leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Child CTA */}
      {child && revealed >= (data?.transcript.length ?? 0) && (
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
          <Link
            href={`/profile/${child.token_address}`}
            className="flex-1 text-center px-5 py-3 bg-house-child/10 border border-house-child/40 text-house-child font-semibold rounded hover:bg-house-child/20 transition-colors text-sm"
          >
            View {child.name} Profile →
          </Link>
          <Link
            href="/tree"
            className="flex-1 text-center px-5 py-3 border border-house-border text-house-muted hover:border-house-amber hover:text-house-text rounded transition-colors text-sm"
          >
            Family Tree →
          </Link>
        </div>
      )}
    </div>
  );
}
