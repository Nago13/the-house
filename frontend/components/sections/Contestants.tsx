"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"
import Link from "next/link"
import contestants from "@/lib/contestants"
import { isChatEnabled } from "@/lib/api"
import { usePrices, formatPrice, formatChange, type PricesMap } from "@/lib/prices"
import type { Contestant } from "@/lib/types"

const TOKEN_COLORS: Record<string, string> = {
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
}

const GEN_BADGE_COLOR: Record<number, string> = {
  1: "#F59E0B",
  2: "#A855F7",
}

const TRAIT_LABELS: Record<string, string> = {
  verbosity:           "VERBOSITY",
  aggression:          "AGGRESSION",
  humor_axis:          "HUMOR",
  sociability:         "SOCIABILITY",
  volatility_response: "VOLATILITY",
}

function getRole(c: Contestant): string {
  if (c.genesis_archetype) return c.genesis_archetype
  if (c.generation > 0) return `Gen ${c.generation} · Born in The House`
  return "Contestant"
}

function TraitBar({ name, value, color, delay }: { name: string; value: number; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const pct = Math.round(value * 100)
  return (
    <div ref={ref} className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-[10px] tracking-[0.2em] uppercase text-text-secondary">{name}</span>
        <span className="text-[10px] text-text-secondary">{pct}</span>
      </div>
      <div className="h-px bg-white/5 relative overflow-hidden rounded-full">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : { width: 0 }}
          transition={{ duration: 1.2, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

function CardInner({ c, prices }: { c: Contestant; prices: PricesMap | null }) {
  const color = TOKEN_COLORS[c.ticker] ?? "#F5F5F7"
  const chatEnabled = isChatEnabled(c.token_address)
  const traits = Object.entries(c.behavioral_traits)
  const pd = prices?.[c.ticker]
  const badgeColor = c.generation > 0 ? (GEN_BADGE_COLOR[c.generation] ?? "#A855F7") : null
  const isGen2 = c.generation === 2
  const isChild = c.generation > 0
  const padding = isChild ? "1.5rem" : "2rem"

  return (
    <div className="relative overflow-hidden rounded-2xl group h-full" style={{ background: "#0D0D14" }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{
        background: isGen2
          ? "linear-gradient(90deg, transparent, #F59E0B88, #A855F788, transparent)"
          : `linear-gradient(90deg, transparent, ${color}88, transparent)`,
      }} />

      {/* Hover glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `${color}08` }}
      />

      <div style={{ padding }}>
        {/* Gen 2 historic badge */}
        {isGen2 && (
          <div className="mb-5 text-center">
            <span
              className="inline-block text-[9px] tracking-[0.3em] uppercase font-mono px-3 py-1 rounded-full"
              style={{ background: "#A855F718", color: "#A855F7", border: "1px solid #A855F744" }}
            >
              First second-generation token in The House history
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] tracking-[0.25em] uppercase font-medium" style={{ color }}>
                ${c.ticker}
              </span>
              {badgeColor && (
                <span
                  className="text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}44` }}
                >
                  GEN {c.generation}
                </span>
              )}
              {pd?.price != null && (
                <span className="text-[10px] text-text-secondary">{formatPrice(pd.price)}</span>
              )}
              {pd?.change_24h != null && (
                <span className={`text-[10px] font-semibold ${pd.change_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatChange(pd.change_24h)}
                </span>
              )}
            </div>
            <h3 className={`font-display text-text-primary tracking-tight ${isChild ? "text-2xl" : "text-3xl"}`}>
              {c.name}
            </h3>
            <p className="text-text-secondary text-sm mt-1">{getRole(c)}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color }}>Mood</div>
            <div className="text-text-primary text-sm">{pd?.mood ?? "—"}</div>
          </div>
        </div>

        {/* Trait bars */}
        <div className="mb-8 border-t border-white/5 pt-6">
          {traits.map(([key, val], i) => (
            <TraitBar key={key} name={TRAIT_LABELS[key] ?? key.toUpperCase()} value={val} color={color} delay={0.3 + i * 0.1} />
          ))}
        </div>

        {/* Last transmission */}
        <div className="rounded-xl p-4 mb-8" style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
          <div className="text-[10px] tracking-[0.2em] uppercase text-text-secondary mb-2">Last transmission</div>
          <p className="text-text-secondary text-sm leading-relaxed italic">&ldquo;{c.signature_phrase}&rdquo;</p>
        </div>

        {/* CTA */}
        {chatEnabled ? (
          <Link href={`/chat/${c.token_address}`}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="w-full py-3 rounded-full text-sm font-medium text-center transition-all cursor-pointer"
              style={{ border: `1px solid ${color}44`, color, background: `${color}08` }}
            >
              Talk to {c.name}
            </motion.div>
          </Link>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="w-full py-3 rounded-full text-sm font-medium transition-all opacity-50 cursor-not-allowed"
            style={{ border: `1px solid ${color}44`, color, background: `${color}08` }}
            disabled
          >
            Talk to {c.name} — Season 2
          </motion.button>
        )}
      </div>
    </div>
  )
}

function ContestantCard({ c, index, prices }: { c: Contestant; index: number; prices: PricesMap | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const color = TOKEN_COLORS[c.ticker] ?? "#F5F5F7"
  const isGen2 = c.generation === 2
  const isChild = c.generation > 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.12 }}
      className="rounded-2xl"
      style={isGen2 ? {
        padding: "1px",
        background: "linear-gradient(135deg, #F59E0B, #A855F7)",
        boxShadow: "0 0 60px #A855F71A, 0 0 30px #F59E0B0D",
      } : {
        border: `1px solid ${color}${isChild ? "28" : "18"}`,
        ...(isChild ? { boxShadow: `0 0 40px ${color}0A` } : {}),
      }}
    >
      <CardInner c={c} prices={prices} />
    </motion.div>
  )
}

function SectionDivider({ label, sublabel, inView, delay }: { label: string; sublabel?: string; inView: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col items-center gap-2 mb-8"
    >
      <div className="flex items-center gap-4 w-full">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 h-px bg-white/5" />
      </div>
      {sublabel && (
        <p className="text-[10px] text-text-secondary/60 tracking-wider font-mono">{sublabel}</p>
      )}
    </motion.div>
  )
}

export function Contestants() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })
  const prices = usePrices()

  const GEN0_ORDER = ["SHIB","DOGE","PEPE","MOM","DAD","FLOKI","PENGU","FARTCOIN","PHNIX"]
  const gen0raw = contestants.filter((c) => c.generation === 0)
  const founders = [
    ...GEN0_ORDER.map((t) => gen0raw.find((c) => c.ticker === t)).filter(Boolean),
    ...gen0raw.filter((c) => !GEN0_ORDER.includes(c.ticker)),
  ] as typeof contestants
  const gen1 = contestants.filter((c) => c.generation === 1)
  const gen2 = contestants.filter((c) => c.generation === 2)

  return (
    <section
      className="relative py-32 px-6 overflow-hidden"
      style={{
        background:           "rgba(10,10,15,0.84)",
        backdropFilter:       "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderTop:            "1px solid rgba(255,255,255,0.04)",
        borderBottom:         "1px solid rgba(255,255,255,0.03)",
      }}
    >
      <div ref={ref} className="relative z-10 max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.3em] uppercase text-text-secondary text-center mb-4"
        >
          Season One Cast
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-3xl md:text-5xl text-center text-text-primary mb-4 tracking-tight"
        >
          Meet the contestants.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-text-secondary text-center mb-16 max-w-lg mx-auto"
        >
          10 founders. 4 children. 1 grandchild. The dynasties are forming.
        </motion.p>

        {/* ── Generation 0: Founders ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {founders.map((c, i) => (
            <ContestantCard key={c.token_address} c={c} index={i} prices={prices} />
          ))}
        </div>

        {/* ── Generation 1 ── */}
        {gen1.length > 0 && (
          <>
            <SectionDivider label="Generation 1" sublabel="Born from the founders" inView={inView} delay={0.3} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {gen1.map((c, i) => (
                <ContestantCard key={c.token_address} c={c} index={founders.length + i} prices={prices} />
              ))}
            </div>
          </>
        )}

        {/* ── Generation 2 ── */}
        {gen2.length > 0 && (
          <>
            <SectionDivider label="Generation 2" sublabel="The first grandchild — a dynasty forms" inView={inView} delay={0.45} />
            <div className="flex justify-center">
              <div className="w-full max-w-lg">
                {gen2.map((c, i) => (
                  <ContestantCard key={c.token_address} c={c} index={founders.length + gen1.length + i} prices={prices} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
