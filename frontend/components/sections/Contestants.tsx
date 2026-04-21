"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"
import Link from "next/link"
import contestants from "@/lib/contestants"
import { isChatEnabled } from "@/lib/api"
import type { Contestant } from "@/lib/types"

const TOKEN_COLORS: Record<string, string> = {
  MOM:  "#F5C842",
  DAD:  "#A855F7",
  GNSP: "#F59E0B",
}

const TOKEN_MOODS: Record<string, string> = {
  MOM:  "Dominant",
  DAD:  "Assertive",
  GNSP: "Emergent",
}

const MOOD_DELTA: Record<string, string> = {
  MOM:  "+12.4%",
  DAD:  "+8.1%",
  GNSP: "+41.7%",
}

const TRAIT_LABELS: Record<string, string> = {
  verbosity:           "VERBOSITY",
  aggression:          "AGGRESSION",
  humor_axis:          "HUMOR",
  sociability:         "SOCIABILITY",
  volatility_response: "VOLATILITY",
}

function getRole(c: Contestant): string {
  if (c.generation === 0) {
    return c.ticker === "MOM" ? "The Matriarch" : "The Patriarch"
  }
  return "Gen 1 · Born from $MOM × $DAD"
}

function TraitBar({
  name, value, color, delay,
}: { name: string; value: number; color: string; delay: number }) {
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

function ContestantCard({
  c, index, isChild,
}: { c: Contestant; index: number; isChild: boolean }) {
  const ref   = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const color  = TOKEN_COLORS[c.ticker] ?? "#F5F5F7"
  const chatEnabled = isChatEnabled(c.token_address)
  const traits = Object.entries(c.behavioral_traits)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.15 }}
      className="relative rounded-2xl overflow-hidden group"
      style={{
        background: "#0D0D14",
        border: `1px solid ${color}${isChild ? "28" : "18"}`,
        ...(isChild ? { boxShadow: `0 0 40px ${color}0A` } : {}),
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}88, transparent)` }}
      />

      {/* Ambient glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `${color}08` }}
      />

      <div className={isChild ? "p-6" : "p-8"}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] tracking-[0.25em] uppercase font-medium"
                style={{ color }}
              >
                ${c.ticker}
              </span>
              {isChild && (
                <span
                  className="text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}
                >
                  GEN 1
                </span>
              )}
              <span className="text-[10px] text-[#F59E0B]">{MOOD_DELTA[c.ticker] ? `Mood ${MOOD_DELTA[c.ticker]}` : ""}</span>
            </div>
            <h3
              className={`font-display text-text-primary tracking-tight ${isChild ? "text-2xl" : "text-3xl"}`}
            >
              {c.name}
            </h3>
            <p className="text-text-secondary text-sm mt-1">{getRole(c)}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color }}>
              Mood
            </div>
            <div className="text-text-primary text-sm">{TOKEN_MOODS[c.ticker] ?? "Unknown"}</div>
          </div>
        </div>

        {/* Trait bars */}
        <div className="mb-8 border-t border-white/5 pt-6">
          {traits.map(([key, val], i) => (
            <TraitBar
              key={key}
              name={TRAIT_LABELS[key] ?? key.toUpperCase()}
              value={val}
              color={color}
              delay={0.3 + i * 0.1}
            />
          ))}
        </div>

        {/* Last transmission */}
        <div
          className="rounded-xl p-4 mb-8"
          style={{ background: `${color}08`, border: `1px solid ${color}18` }}
        >
          <div className="text-[10px] tracking-[0.2em] uppercase text-text-secondary mb-2">
            Last transmission
          </div>
          <p className="text-text-secondary text-sm leading-relaxed italic">
            &ldquo;{c.signature_phrase}&rdquo;
          </p>
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
            {isChild ? "Talk to GNSP — Season 2" : `Talk to ${c.name} — Season 2`}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

export function Contestants() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  const founders = contestants.filter((c) => c.generation === 0)
  const children = contestants.filter((c) => c.generation > 0)

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
          Two tokens. Real personalities. Real memories. They already know each other.
        </motion.p>

        {/* Founders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {founders.map((c, i) => (
            <ContestantCard key={c.token_address} c={c} index={i} isChild={false} />
          ))}
        </div>

        {/* Gen 1 children — centered, slightly smaller */}
        {children.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary">
                Generation 1
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </motion.div>
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                {children.map((c, i) => (
                  <ContestantCard
                    key={c.token_address}
                    c={c}
                    index={founders.length + i}
                    isChild
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
