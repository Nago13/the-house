"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"
import { MATING_STEPS } from "@/lib/constants"

function Step({
  step,
  index,
  isLast,
}: {
  step: typeof MATING_STEPS[0]
  index: number
  isLast: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <div ref={ref} className="relative flex gap-6 md:gap-8">
      {/* Left column: number + connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: index * 0.15 }}
          className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-medium tracking-widest relative z-10"
          style={{
            border: `1px solid ${step.accent}44`,
            color: step.accent,
            background: `${step.accent}08`,
            boxShadow: `0 0 20px ${step.accent}22`,
          }}
        >
          {step.number}
        </motion.div>

        {!isLast && (
          <motion.div
            className="w-px flex-1 mt-2"
            style={{ background: `linear-gradient(180deg, ${step.accent}44, transparent)` }}
            initial={{ scaleY: 0, originY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.8, delay: index * 0.15 + 0.3 }}
          />
        )}
      </div>

      {/* Right column: content */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: index * 0.15 + 0.1 }}
        className={`pb-14 ${isLast ? "" : ""}`}
      >
        <h3
          className="font-display text-2xl md:text-3xl tracking-tight mb-3"
          style={{ color: step.accent }}
        >
          {step.title}
        </h3>
        <p className="text-text-secondary leading-relaxed max-w-lg font-light">
          {step.body}
        </p>
      </motion.div>
    </div>
  )
}

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section
      className="relative py-32 px-6 overflow-hidden"
      style={{
        background:           "rgba(10,10,15,0.86)",
        backdropFilter:       "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderTop:            "1px solid rgba(255,255,255,0.04)",
        borderBottom:         "1px solid rgba(255,255,255,0.03)",
      }}
    >

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Left: header */}
          <div ref={ref} className="md:sticky md:top-32">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-xs tracking-[0.3em] uppercase text-text-secondary mb-4"
            >
              The Mating Event
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-3xl md:text-5xl text-text-primary tracking-tight leading-tight mb-6"
            >
              How two tokens
              <br />
              <span className="bg-gradient-to-r from-[#FF6B2B] to-[#A855F7] bg-clip-text text-transparent">
                make a third.
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-text-secondary leading-relaxed font-light"
            >
              Four stages. All on-chain. All in public. The first time in history
              that reproduction is a smart contract.
            </motion.p>

            {/* Genome visual */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="mt-12 rounded-xl p-6 border border-white/5"
              style={{ background: "#0D0D14" }}
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-text-secondary mb-4">
                Genome Inheritance
              </div>
              <div className="space-y-2">
                {[
                  { label: "MOM genome", pct: 40, color: "#F5C842" },
                  { label: "DAD genome", pct: 40, color: "#A855F7" },
                  { label: "Emergent", pct: 20, color: "#FF6B2B" },
                ].map((g) => (
                  <div key={g.label} className="flex items-center gap-3">
                    <div className="text-[10px] text-text-secondary w-24 flex-shrink-0">{g.label}</div>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: g.color }}
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${g.pct}%` } : { width: 0 }}
                        transition={{ duration: 1, delay: 0.7 }}
                      />
                    </div>
                    <div className="text-[10px] text-text-secondary w-8">{g.pct}%</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: steps */}
          <div className="pt-2">
            {MATING_STEPS.map((step, i) => (
              <Step key={step.number} step={step} index={i} isLast={i === MATING_STEPS.length - 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
