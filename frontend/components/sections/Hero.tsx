"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react"
import { useScrollStore } from "@/lib/scroll-store"

const PARTICLES = [
  { id: 1,  x: 8,  y: 12, color: "#F5C842", duration: 9,  delay: 0.0, size: 2 },
  { id: 2,  x: 23, y: 45, color: "#A855F7", duration: 11, delay: 1.5, size: 1.5 },
  { id: 3,  x: 67, y: 8,  color: "#F5C842", duration: 13, delay: 0.8, size: 2 },
  { id: 4,  x: 85, y: 30, color: "#A855F7", duration: 8,  delay: 2.2, size: 1.5 },
  { id: 5,  x: 42, y: 72, color: "#F5C842", duration: 10, delay: 0.3, size: 2 },
  { id: 6,  x: 91, y: 65, color: "#A855F7", duration: 12, delay: 1.8, size: 1.5 },
  { id: 7,  x: 15, y: 88, color: "#F5C842", duration: 14, delay: 0.6, size: 2 },
  { id: 8,  x: 55, y: 20, color: "#A855F7", duration: 9,  delay: 3.1, size: 1.5 },
  { id: 9,  x: 78, y: 82, color: "#F5C842", duration: 11, delay: 2.5, size: 2 },
  { id: 10, x: 33, y: 55, color: "#A855F7", duration: 13, delay: 1.2, size: 1.5 },
  { id: 11, x: 62, y: 40, color: "#F5C842", duration: 8,  delay: 4.0, size: 2 },
  { id: 12, x: 5,  y: 60, color: "#A855F7", duration: 10, delay: 0.9, size: 1.5 },
  { id: 13, x: 47, y: 92, color: "#F5C842", duration: 12, delay: 2.8, size: 2 },
  { id: 14, x: 88, y: 15, color: "#A855F7", duration: 14, delay: 1.6, size: 1.5 },
  { id: 15, x: 20, y: 35, color: "#F5C842", duration: 9,  delay: 3.5, size: 2 },
  { id: 16, x: 72, y: 58, color: "#A855F7", duration: 11, delay: 0.4, size: 1.5 },
  { id: 17, x: 38, y: 18, color: "#F5C842", duration: 13, delay: 2.0, size: 2 },
  { id: 18, x: 95, y: 78, color: "#A855F7", duration: 8,  delay: 1.1, size: 1.5 },
  { id: 19, x: 28, y: 68, color: "#F5C842", duration: 10, delay: 3.8, size: 2 },
  { id: 20, x: 58, y: 95, color: "#A855F7", duration: 12, delay: 0.7, size: 1.5 },
]

export function Hero() {
  const containerRef    = useRef<HTMLDivElement>(null)
  const setHeroProgress = useScrollStore((s) => s.setHeroProgress)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  useMotionValueEvent(scrollYProgress, "change", setHeroProgress)

  // ── Chapter 1: "For the first time in history," — visible immediately
  const c1Opacity = useTransform(scrollYProgress, [0, 0.24, 0.34], [1, 1, 0])
  const c1Y       = useTransform(scrollYProgress, [0, 0.24, 0.34], [0, 0, -28])

  // ── Chapter 2: "two tokens had sex."
  const c2Opacity = useTransform(scrollYProgress, [0.30, 0.40, 0.55, 0.65], [0, 1, 1, 0])
  const c2Y       = useTransform(scrollYProgress, [0.30, 0.40, 0.55, 0.65], [28, 0, 0, -28])

  // ── Chapter 3: Birth / CTA
  const c3Opacity = useTransform(scrollYProgress, [0.63, 0.73, 0.95, 1.0], [0, 1, 1, 0])
  const c3Y       = useTransform(scrollYProgress, [0.63, 0.73], [28, 0])

  // Birth flash at ~0.5
  const flashOpacity = useTransform(scrollYProgress, [0.44, 0.50, 0.56], [0, 0.6, 0])

  // Scroll indicator fades
  const scrollHint = useTransform(scrollYProgress, [0, 0.06], [1, 0])

  // Persistent top label — visible from start
  const labelOpacity = useTransform(scrollYProgress, [0, 0.9, 1], [1, 1, 0])

  return (
    <div ref={containerRef} style={{ height: "300vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* Subtle particle layer (floats over 3D) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left:            `${p.x}%`,
                top:             `${p.y}%`,
                width:           p.size,
                height:          p.size,
                backgroundColor: p.color,
                boxShadow:       `0 0 ${p.size * 4}px ${p.color}`,
              }}
              animate={{ opacity: [0.3, 0.7, 0.3], y: [0, -16, 0] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        {/* Birth flash overlay */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            opacity:    flashOpacity,
            background: "radial-gradient(ellipse at center, rgba(52,211,153,0.35) 0%, rgba(94,242,255,0.18) 40%, transparent 70%)",
          }}
        />

        {/* Top label */}
        <motion.p
          style={{ opacity: labelOpacity }}
          className="absolute top-8 left-1/2 -translate-x-1/2 z-30 text-[10px] tracking-[0.35em] uppercase text-text-secondary whitespace-nowrap"
        >
          The House — Season One — BNB Chain
        </motion.p>

        {/* Chapter 1 */}
        <motion.div
          style={{ opacity: c1Opacity, y: c1Y }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 pointer-events-none"
        >
          <h1 className="font-display text-5xl md:text-7xl lg:text-[90px] tracking-tight leading-tight text-text-primary drop-shadow-[0_2px_40px_rgba(94,242,255,0.15)]">
            For the first time
            <br />
            in history,
          </h1>
        </motion.div>

        {/* Chapter 2 */}
        <motion.div
          style={{ opacity: c2Opacity, y: c2Y }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 pointer-events-none"
        >
          <h1 className="font-display text-5xl md:text-7xl lg:text-[90px] tracking-tight leading-none">
            <span className="bg-gradient-to-r from-[#F5C842] via-[#FF6B2B] to-[#A855F7] bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(94,242,255,0.3)]">
              two tokens had sex.
            </span>
          </h1>
          <p className="text-text-secondary text-xl md:text-2xl mt-6 font-light tracking-wide">
            And it happened on-chain.
          </p>
        </motion.div>

        {/* Chapter 3 — Birth / CTA */}
        <motion.div
          style={{ opacity: c3Opacity, y: c3Y }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6"
        >
          <p className="text-[11px] tracking-[0.35em] uppercase text-[#F59E0B] mb-6">
            Born · Block #39,482,291
          </p>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-tight leading-tight text-text-primary mb-4 drop-shadow-[0_2px_30px_rgba(52,211,153,0.2)]">
            Their child is real.
            <br />
            <span className="text-[#F59E0B]">You can own it.</span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl mb-10 font-light">
            Deployed on BNB Chain. Trading now.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-r from-[#F5C842] to-[#A855F7] text-obsidian font-medium px-10 py-4 rounded-full shadow-[0_0_50px_-10px_#F5C842] hover:shadow-[0_0_70px_-5px_#A855F7] transition-shadow text-base"
            >
              Enter The House
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="bg-black/30 backdrop-blur-md border border-white/10 text-text-primary px-10 py-4 rounded-full hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors text-base"
            >
              Watch It Happen
            </motion.button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: scrollHint }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="text-[9px] tracking-[0.35em] uppercase text-text-secondary/40">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-text-secondary/25 to-transparent"
          />
        </motion.div>

      </div>
    </div>
  )
}
