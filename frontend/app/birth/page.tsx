"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import contestants from "@/lib/contestants";

interface TranscriptEntry { speaker: string; ticker: string; content: string; timestamp: string; tx_id: string; }
interface AgreedTerms { child_name_hint: string; inheritance_note: string; dowry_amount: string; }
interface Transcript { transcript: TranscriptEntry[]; agreed_terms: AgreedTerms; }

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://the-house-backend-production.up.railway.app";

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

const TICKER_COLORS: Record<string, string> = {
  MOM: "#F5C842", DAD: "#A855F7", GNSP: "#F59E0B",
};

export default function BirthPage() {
  const [data,     setData]     = useState<Transcript | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [revealed, setRevealed] = useState(0);

  const child = contestants.find(c => c.generation > 0);
  const mom   = contestants.find(c => c.ticker === "MOM");
  const dad   = contestants.find(c => c.ticker === "DAD");

  useEffect(() => {
    fetch(`${API_BASE}/api/transcript`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const parsed = Array.isArray(d) ? d[0] : d;
        setData(parsed?.transcript ? parsed : FALLBACK);
        setLoading(false);
      })
      .catch(() => { setData(FALLBACK); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!data || !data.transcript || revealed >= data.transcript.length) return;
    const t = setTimeout(() => setRevealed(r => r + 1), 700);
    return () => clearTimeout(t);
  }, [data, revealed]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">

      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase mb-3" style={{ color: "#F5C842" }}>
          The House · Event Log
        </p>
        <h1 className="font-display text-5xl text-white mb-3 tracking-tight">First Birth</h1>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
          On-chain mating event between $MOM and $DAD. Negotiated via x402 protocol.
          Child token deployed to BNB testnet.
        </p>
      </div>

      {/* Parent portraits */}
      <div
        className="relative flex items-center gap-6 mb-10 p-5 rounded-2xl overflow-hidden"
        style={{ background: "#0D0D14", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(245,200,66,0.4), transparent)" }} />
        {[mom, dad].filter(Boolean).map(p => p && (
          <Link key={p.token_address} href={`/profile/${p.token_address}`} className="flex items-center gap-3 group">
            <div
              className="rounded-xl overflow-hidden transition-all"
              style={{ width: 48, height: 48, border: `2px solid ${TICKER_COLORS[p.ticker] ?? "#A855F7"}44` }}
            >
              <Image src={p.portrait_url} alt={p.name} width={48} height={48} className="object-cover" onError={() => {}} />
            </div>
            <div>
              <p className="font-bold text-sm text-white">{p.name}</p>
              <p className="font-mono text-xs" style={{ color: TICKER_COLORS[p.ticker] ?? "#A855F7" }}>${p.ticker}</p>
            </div>
          </Link>
        ))}
        <div className="flex-1 text-center font-mono text-2xl" style={{ color: "rgba(255,255,255,0.2)" }}>×</div>
        {child && (
          <Link href={`/profile/${child.token_address}`} className="flex items-center gap-3 group">
            <div
              className="rounded-xl overflow-hidden transition-all"
              style={{ width: 56, height: 56, border: `2px solid ${TICKER_COLORS[child.ticker] ?? "#F59E0B"}44` }}
            >
              <Image src={child.portrait_url} alt={child.name} width={56} height={56} className="object-cover" onError={() => {}} />
            </div>
            <div>
              <p className="font-bold text-sm text-white">{child.name}</p>
              <p className="font-mono text-xs" style={{ color: TICKER_COLORS[child.ticker] ?? "#F59E0B" }}>
                ${child.ticker} · Gen 1
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Transcript */}
      <section className="mb-10">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase mb-5" style={{ color: "#F5C842" }}>
          Negotiation Transcript
        </p>
        {loading ? (
          <div className="font-mono text-xs animate-pulse" style={{ color: "rgba(255,255,255,0.2)" }}>
            Loading transcript...
          </div>
        ) : (
          <div
            className="relative font-mono text-xs rounded-2xl overflow-hidden"
            style={{ background: "#0D0D14", border: "1px solid rgba(245,200,66,0.12)" }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(245,200,66,0.5), transparent)" }} />
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.4)" }}>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              <span className="ml-2" style={{ color: "rgba(255,255,255,0.2)" }}>x402://the-house/mate — session active</span>
            </div>
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {data?.transcript?.slice(0, revealed).map((entry, i) => (
                <div key={i} className="flex gap-3 animate-fade-in">
                  <span className="flex-shrink-0 font-bold" style={{ color: TICKER_COLORS[entry.ticker] ?? "#F5C842" }}>
                    ${entry.ticker}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.7)" }}>{entry.content}</p>
                    <p className="text-[10px] mt-1 truncate" style={{ color: "rgba(255,255,255,0.15)" }}>{entry.tx_id}</p>
                  </div>
                </div>
              ))}
              {revealed < (data?.transcript?.length ?? 0) && (
                <div className="animate-pulse" style={{ color: "#F5C842" }}>▋</div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Agreed Terms */}
      {data && data.transcript && revealed >= data.transcript.length && (
        <section className="mb-10">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase mb-4" style={{ color: "#F5C842" }}>
            Agreed Terms
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Child Concept",  value: data.agreed_terms.child_name_hint },
              { label: "Inheritance",    value: data.agreed_terms.inheritance_note },
              { label: "Dowry",          value: data.agreed_terms.dowry_amount },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="relative p-4 rounded-xl overflow-hidden"
                style={{ background: "#0D0D14", border: "1px solid rgba(245,200,66,0.12)" }}
              >
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(245,200,66,0.5), transparent)" }} />
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</p>
                <p className="text-xs leading-relaxed text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTAs */}
      {child && revealed >= (data?.transcript?.length ?? 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/profile/${child.token_address}`}
            className="flex-1 text-center px-5 py-4 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-80"
            style={{ background: "linear-gradient(135deg, #F5C842cc, #F59E0B88)", color: "#07060A" }}
          >
            View {child.name} Profile →
          </Link>
          <Link
            href="/tree"
            className="flex-1 text-center px-5 py-4 rounded-2xl text-sm transition-colors hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
          >
            Family Tree →
          </Link>
        </div>
      )}
    </div>
  );
}
