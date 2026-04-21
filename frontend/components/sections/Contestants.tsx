"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"
import { CHARACTERS } from "@/lib/constants"

function TraitBar({ name, value, color, delay }: { name: string; value: number; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <div ref={ref} className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-[10px] tracking-[0.2em] uppercase text-text-secondary">{name}</span>
        <span className="text-[10px] text-text-secondary">{value}</span>
      </div>
      <div className="h-px bg-white/5 relative overflow-hidden rounded-full">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : { width: 0 }}
          transition={{ duration: 1.2, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

function CharacterCard({ char, index }: { char: typeof CHARACTERS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.15 }}
      className="relative rounded-2xl overflow-hidden group"
      style={{ background: "#0D0D14", border: `1px solid ${char.color}18` }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${char.color}88, transparent)` }}
      />

      {/* Ambient glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `${char.color}08` }}
      />

      <div className="p-8">
        {/* Header row */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] tracking-[0.25em] uppercase font-medium"
                style={{ color: char.color }}
              >
                {char.ticker}
              </span>
              <span className="text-[10px] text-emerald">{char.priceChange}</span>
            </div>
            <h3 className="font-display text-3xl text-text-primary tracking-tight">{char.name}</h3>
            <p className="text-text-secondary text-sm mt-1">{char.role}</p>
          </div>
          <div className="text-right">
            <div
              className="text-[10px] tracking-[0.2em] uppercase mb-1"
              style={{ color: char.color }}
            >
              Mood
            </div>
            <div className="text-text-primary text-sm">{char.mood}</div>
          </div>
        </div>

        {/* Trait bars */}
        <div className="mb-8 border-t border-white/5 pt-6">
          {char.traits.map((t, i) => (
            <TraitBar key={t.name} name={t.name} value={t.value} color={char.color} delay={0.3 + i * 0.1} />
          ))}
        </div>

        {/* Last post */}
        <div
          className="rounded-xl p-4 mb-8"
          style={{ background: `${char.color}08`, border: `1px solid ${char.color}18` }}
        >
          <div className="text-[10px] tracking-[0.2em] uppercase text-text-secondary mb-2">Last transmission</div>
          <p className="text-text-secondary text-sm leading-relaxed italic">
            &ldquo;{char.lastPost}&rdquo;
          </p>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="w-full py-3 rounded-full text-sm font-medium transition-all"
          style={{
            border: `1px solid ${char.color}44`,
            color: char.color,
            background: `${char.color}08`,
          }}
        >
          Talk to {char.name}
        </motion.button>
      </div>
    </motion.div>
  )
}

export function Contestants() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  const cast = CHARACTERS.filter((c) => c.lineage === null)

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cast.map((char, i) => (
            <CharacterCard key={char.name} char={char} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
