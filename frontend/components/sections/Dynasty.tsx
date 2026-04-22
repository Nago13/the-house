"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"

const NODES = [
  { id: "MOM",   label: "MOMCOIN", ticker: "$MOM",  color: "#F5C842", cx: 150, cy: 80,  r: 28, cap: "4.2M" },
  { id: "DAD",   label: "DADCOIN", ticker: "$DAD",  color: "#A855F7", cx: 450, cy: 80,  r: 28, cap: "3.8M" },
  { id: "BABY",  label: "BABYCOIN",ticker: "$BABY", color: "#F59E0B", cx: 300, cy: 280, r: 22, cap: "1.1M" },
]

const EDGES = [
  { from: "MOM",  to: "BABY", d: "M 150 108 C 150 190 300 190 300 258", color: "#F5C842" },
  { from: "DAD",  to: "BABY", d: "M 450 108 C 450 190 300 190 300 258", color: "#A855F7" },
]

export function Dynasty() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section
      className="relative py-32 px-6 overflow-hidden"
      style={{
        background:           "rgba(10,10,15,0.84)",
        backdropFilter:       "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderTop:            "1px solid rgba(255,255,255,0.04)",
        borderBottom:         "1px solid rgba(255,255,255,0.03)",
      }}
    >

      <div ref={ref} className="relative z-10 max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.3em] uppercase text-text-secondary text-center mb-4"
        >
          The Bloodline
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-3xl md:text-5xl text-center text-text-primary mb-4 tracking-tight"
        >
          Generation 1.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-text-secondary text-center mb-16 max-w-md mx-auto"
        >
          Every birth is permanent. Every bloodline is public.
          This is what three nodes look like.
          Imagine month six.
        </motion.p>

        {/* Tree SVG */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative max-w-2xl mx-auto"
        >
          <svg
            viewBox="0 0 600 360"
            className="w-full"
            style={{ overflow: "visible" }}
          >
            {/* Defs: glows */}
            <defs>
              {NODES.map((n) => (
                <radialGradient key={n.id} id={`glow-${n.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={n.color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={n.color} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            {/* Edges */}
            {EDGES.map((e, i) => (
              <motion.path
                key={e.from}
                d={e.d}
                stroke={e.color}
                strokeWidth="1"
                fill="none"
                strokeOpacity="0.4"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 1.4, delay: 0.6 + i * 0.2, ease: "easeInOut" as const }}
              />
            ))}

            {/* Nodes */}
            {NODES.map((n, i) => (
              <g key={n.id}>
                {/* Glow halo */}
                <motion.circle
                  cx={n.cx}
                  cy={n.cy}
                  r={n.r * 2.5}
                  fill={`url(#glow-${n.id})`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.8, delay: 0.9 + i * 0.15 }}
                />
                {/* Node circle */}
                <motion.circle
                  cx={n.cx}
                  cy={n.cy}
                  r={n.r}
                  fill="#07060A"
                  stroke={n.color}
                  strokeWidth="1"
                  strokeOpacity="0.6"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.9 + i * 0.15, type: "spring", stiffness: 200 }}
                />
                {/* Ticker label */}
                <motion.text
                  x={n.cx}
                  y={n.cy + 4}
                  textAnchor="middle"
                  fill={n.color}
                  fontSize="9"
                  fontFamily="monospace"
                  letterSpacing="1"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 1.1 + i * 0.15 }}
                >
                  {n.ticker}
                </motion.text>
                {/* Name below */}
                <motion.text
                  x={n.cx}
                  y={n.cy + n.r + 18}
                  textAnchor="middle"
                  fill="#A1A1AA"
                  fontSize="10"
                  fontFamily="sans-serif"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 1.2 + i * 0.15 }}
                >
                  {n.label}
                </motion.text>
                {/* Market cap */}
                <motion.text
                  x={n.cx}
                  y={n.cy + n.r + 30}
                  textAnchor="middle"
                  fill="#4A4A54"
                  fontSize="9"
                  fontFamily="monospace"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 1.3 + i * 0.15 }}
                >
                  ${n.cap}
                </motion.text>
              </g>
            ))}
          </svg>
        </motion.div>

        {/* Bottom label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1.8 }}
          className="text-center text-text-secondary text-sm mt-12 font-light"
        >
          This is what{" "}
          <span className="text-text-primary">month one</span> looks like.
          Every node that follows will have parents, memories, and holders who got the airdrop.
        </motion.p>
      </div>
    </section>
  )
}
