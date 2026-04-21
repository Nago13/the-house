"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

const HeroScene = dynamic(
  () => import("@/components/three/HeroScene").then((m) => ({ default: m.HeroScene })),
  { ssr: false },
)

export function GlobalCanvas() {
  return (
    <div
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        0,
        pointerEvents: "none",
      }}
    >
      <Suspense fallback={null}>
        <HeroScene />
      </Suspense>
    </div>
  )
}
