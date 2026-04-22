"use client";
import { use } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getContestant } from "@/lib/contestants";
import { isChatEnabled } from "@/lib/api";
import TraitBar from "@/components/TraitBar";
import { usePrices, formatPrice, formatChange } from "@/lib/prices";

interface Props {
  params: Promise<{ address: string }>;
}

const PURPLE = "#8B5CF6";
const PURPLE_LIGHT = "#A78BD4";
const BORDER = "rgba(139,92,246,0.2)";
const BORDER_SOFT = "rgba(255,255,255,0.08)";

const TICKER_COLORS: Record<string, string> = {
  MOM:      "#F5C842",
  DAD:      "#A855F7",
  GNSP:     "#F59E0B",
  SHIB:     "#FF6B2B",
  DOGE:     "#C9A84C",
  PEPE:     "#22c55e",
  FLOKI:    "#60a5fa",
  PENGU:    "#93c5fd",
  FARTCOIN: "#84cc16",
  PHNIX:    "#f97316",
  PENKI:    "#7dd3fc",
  PHARTNIX: "#a3e635",
  DOPE:     "#eab308",
  PHARKI:   "#e879f9",
};

export default function ProfilePage({ params }: Props) {
  const { address } = use(params);
  const c = getContestant(address);
  if (!c) notFound();

  const prices = usePrices();
  const pd = prices?.[c.ticker];

  const accentColor = TICKER_COLORS[c.ticker] ?? PURPLE_LIGHT;
  const chatEnabled = isChatEnabled(c.token_address);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">

      {/* ── Header ── */}
      <div className="mb-10">
        <p className="text-[10px] tracking-[0.25em] uppercase font-mono mb-3" style={{ color: PURPLE }}>
          Contestant Profile
        </p>
        <div className="flex gap-6 items-start">
          <div
            className="rounded-2xl overflow-hidden flex-shrink-0"
            style={{
              width: 100,
              height: 100,
              border: `2px solid ${accentColor}44`,
              boxShadow: `0 0 32px ${accentColor}22`,
            }}
          >
            <Image
              src={c.portrait_url}
              alt={c.name}
              width={100}
              height={100}
              className="object-cover w-full h-full"
              onError={() => {}}
            />
          </div>
          <div className="flex flex-col justify-center pt-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-[10px] tracking-[0.2em] uppercase font-mono font-bold"
                style={{ color: accentColor }}
              >
                ${c.ticker}
              </span>
              {c.generation > 0 && (
                <span
                  className="text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full font-mono"
                  style={{
                    background: `${accentColor}18`,
                    color: accentColor,
                    border: `1px solid ${accentColor}44`,
                  }}
                >
                  GEN {c.generation}
                </span>
              )}
              {pd?.price != null && (
                <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {formatPrice(pd.price)}
                </span>
              )}
              {pd?.change_24h != null && (
                <span
                  className="font-mono text-[11px] font-semibold"
                  style={{ color: pd.change_24h >= 0 ? "#34d399" : "#f87171" }}
                >
                  {formatChange(pd.change_24h)}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{c.name}</h1>
            <p className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {c.genesis_archetype}
            </p>
            {pd?.mood && (
              <p className="font-mono text-xs mt-1" style={{ color: accentColor }}>
                Mood: {pd.mood}
              </p>
            )}
            <p className="font-mono text-[10px] mt-2 truncate max-w-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              {c.token_address}
              {c.mock_deploy && (
                <span className="ml-2" style={{ color: "#F59E0B" }}>[testnet]</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Signature phrase ── */}
      <div
        className="rounded-2xl p-5 mb-8"
        style={{
          background: `${accentColor}08`,
          border: `1px solid ${accentColor}22`,
        }}
      >
        <p className="text-[10px] tracking-[0.2em] uppercase font-mono mb-2" style={{ color: accentColor }}>
          Last Transmission
        </p>
        <p className="italic text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          &ldquo;{c.signature_phrase}&rdquo;
        </p>
      </div>

      {/* ── Traits ── */}
      <section className="mb-8">
        <p className="text-[10px] tracking-[0.25em] uppercase font-mono mb-4" style={{ color: PURPLE }}>
          Behavioral Genome
        </p>
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER_SOFT}` }}
        >
          {Object.entries(c.behavioral_traits).map(([key, val]) => (
            <TraitBar key={key} traitKey={key} value={val} />
          ))}
        </div>
      </section>

      {/* ── Lore ── */}
      <section className="mb-8">
        <p className="text-[10px] tracking-[0.25em] uppercase font-mono mb-4" style={{ color: PURPLE }}>
          Background
        </p>
        <div className="space-y-3">
          {c.lore_text.split("\n\n").map((para, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* ── Lineage ── */}
      {c.parents.length > 0 && (
        <section className="mb-8">
          <p className="text-[10px] tracking-[0.25em] uppercase font-mono mb-3" style={{ color: PURPLE }}>
            Lineage
          </p>
          <Link
            href="/tree"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: PURPLE_LIGHT }}
          >
            View full family tree →
          </Link>
        </section>
      )}

      {/* ── Chat CTA ── */}
      <div className="mt-10">
        {chatEnabled ? (
          <Link
            href={`/chat/${c.token_address}`}
            className="block w-full text-center px-6 py-4 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-80"
            style={{
              background: `linear-gradient(135deg, #6B48A8, #9B7DD4)`,
              color: "#fff",
            }}
          >
            Chat with {c.name}
          </Link>
        ) : (
          <div
            className="block w-full text-center px-6 py-4 rounded-2xl text-sm cursor-not-allowed"
            style={{
              border: `1px solid ${BORDER}`,
              color: "rgba(255,255,255,0.25)",
            }}
          >
            Chat available in Season 2
          </div>
        )}
      </div>
    </div>
  );
}
