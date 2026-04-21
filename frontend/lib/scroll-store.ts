import { create } from "zustand"

interface ScrollStore {
  heroProgress: number
  globalProgress: number
  setHeroProgress:   (p: number) => void
  setGlobalProgress: (p: number) => void
}

export const useScrollStore = create<ScrollStore>((set) => ({
  heroProgress:      0,
  globalProgress:    0,
  setHeroProgress:   (heroProgress)   => set({ heroProgress }),
  setGlobalProgress: (globalProgress) => set({ globalProgress }),
}))
