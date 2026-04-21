import { GlobalCanvas }        from "@/components/three/GlobalCanvas"
import { GlobalScrollTracker } from "@/components/GlobalScrollTracker"
import { Hero }        from "@/components/sections/Hero"
import { Thesis }      from "@/components/sections/Thesis"
import { Contestants } from "@/components/sections/Contestants"
import { HowItWorks }  from "@/components/sections/HowItWorks"
import { Dynasty }     from "@/components/sections/Dynasty"
import { FinalCTA }    from "@/components/sections/FinalCTA"

export default function Home() {
  return (
    <>
      {/* Fixed 3D canvas — always behind everything */}
      <GlobalCanvas />
      <GlobalScrollTracker />

      {/* Pull up to cover nav offset, then stack sections over the living organism */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "-3.5rem" }}>
        <Hero />
        <Thesis />
        <Contestants />
        <HowItWorks />
        <Dynasty />
        <FinalCTA />
      </div>
    </>
  )
}
