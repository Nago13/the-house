"use client"

import { useEffect } from "react"
import { useScrollStore } from "@/lib/scroll-store"

export function GlobalScrollTracker() {
  const setGlobalProgress = useScrollStore((s) => s.setGlobalProgress)

  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight
      setGlobalProgress(max > 0 ? window.scrollY / max : 0)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [setGlobalProgress])

  return null
}
