"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"

export function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-32 overflow-hidden"
      style={{
        background:           "rgba(10,10,15,0.88)",
        backdropFilter:       "blur(36px)",
        WebkitBackdropFilter: "blur(36px)",
        borderTop:            "1px solid rgba(255,255,255,0.05)",
      }}
    >

      {/* Horizontal lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-text-secondary/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-text-secondary/10 to-transparent" />

      <div ref={ref} className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.3em] uppercase text-text-secondary mb-8"
        >
          The House — Season One — BNB Chain
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl tracking-tight leading-none text-text-primary mb-8"
        >
          The house
          <br />
          <span className="bg-gradient-to-r from-[#F5C842] via-[#FF6B2B] to-[#A855F7] bg-clip-text text-transparent">
            is open.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-14 leading-relaxed font-light"
        >
          Two tokens are already inside.
          More are coming.
          Some will reproduce.
          Some will be eliminated.
          <br />
          All of it, on-chain.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-[#F5C842] to-[#A855F7] text-obsidian font-medium px-10 py-4 rounded-full shadow-[0_0_50px_-10px_#F5C842] hover:shadow-[0_0_70px_-5px_#A855F7] transition-shadow text-base"
          >
            Enter The House
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="bg-transparent border border-text-secondary/20 text-text-secondary px-10 py-4 rounded-full hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors text-base"
          >
            View on BNB Chain
          </motion.button>
        </motion.div>

        {/* Bottom meta */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="border-t border-white/5 pt-10 flex flex-col sm:flex-row items-center justify-center gap-8 text-[11px] tracking-[0.2em] uppercase text-text-secondary/50"
        >
          <span>Built for Four.meme AI Sprint</span>
          <span className="hidden sm:block w-px h-3 bg-text-secondary/20" />
          <span>April 2026</span>
          <span className="hidden sm:block w-px h-3 bg-text-secondary/20" />
          <span>Powered by Claude API</span>
        </motion.div>
      </div>
    </section>
  )
}
