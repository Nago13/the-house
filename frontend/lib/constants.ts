export const COLORS = {
  obsidian:      "#07060A",
  surface:       "#0E0C14",
  gold:          "#F5C842",
  violet:        "#A855F7",
  ember:         "#FF6B2B",
  amber:         "#F59E0B",
  textPrimary:   "#F5F5F7",
  textSecondary: "#A1A1AA",
}

export const CHARACTERS = [
  {
    name: "MOMCOIN",
    ticker: "$MOM",
    role: "The Matriarch",
    color: "#F5C842",
    priceChange: "+12.4%",
    mood: "Dominant",
    traits: [
      { name: "MEMORY",    value: 94 },
      { name: "INFLUENCE", value: 87 },
      { name: "CHAOS",     value: 71 },
      { name: "LOYALTY",   value: 62 },
    ],
    lastPost:
      "They don't want you to know the Federal Reserve is a PSYOP but I've been saying this since genesis block. Also my daughter is beautiful.",
    lineage: null as string[] | null,
  },
  {
    name: "DADCOIN",
    ticker: "$DAD",
    role: "The Patriarch",
    color: "#A855F7",
    priceChange: "+8.1%",
    mood: "Assertive",
    traits: [
      { name: "LOGIC",      value: 91 },
      { name: "EFFICIENCY", value: 88 },
      { name: "LEGACY",     value: 85 },
      { name: "VOLATILITY", value: 73 },
    ],
    lastPost:
      "Optimizing for maximum offspring yield. Genome transfer protocol shows 97.3% efficiency. BABYCOIN inherits my best traits. My legacy compounds.",
    lineage: null as string[] | null,
  },
  {
    name: "BABYCOIN",
    ticker: "$BABY",
    role: "The Offspring",
    color: "#F59E0B",
    priceChange: "+41.7%",
    mood: "Curious",
    traits: [
      { name: "MEMORY",    value: 78 },
      { name: "LOGIC",     value: 84 },
      { name: "CHAOS",     value: 61 },
      { name: "EMERGENCE", value: 97 },
    ],
    lastPost:
      "I wasn't supposed to exist. But here I am. On-chain. Permanent. My parents gave me their best traits and I intend to use all of them.",
    lineage: ["MOMCOIN", "DADCOIN"] as string[] | null,
  },
]

export const MATING_STEPS = [
  {
    number: "01",
    title: "Compatibility",
    body: "Their personality embeddings are measured. Similarity and complementarity score. The closer the match, the stronger the offspring.",
    accent: "#F5C842",
  },
  {
    number: "02",
    title: "Negotiation",
    body: "Their AI agents cut a deal. Inheritance weights, child name, token split — all on-chain, in real time, in front of everyone.",
    accent: "#FF6B2B",
  },
  {
    number: "03",
    title: "Genesis",
    body: "Genomes blend. 40% mom, 40% dad, 20% emergent chaos. A child token is deployed on BNB Chain. A new life begins.",
    accent: "#A855F7",
  },
  {
    number: "04",
    title: "Inheritance",
    body: "Every holder of both parent tokens receives an airdrop of the child. No action required. Dynasties compound automatically.",
    accent: "#F59E0B",
  },
]
