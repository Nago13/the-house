# PROGRESS.md — The House MVP Tracker
**Hackathon clock starts now. Updated after every completed task.**

---

## Status: HOUR 0 COMPLETE — Lore locked, scaffold ready, moving to Hours 1-4

---

## Completed

- [x] Monorepo scaffold created (all folders and placeholder files)
- [x] `.env.example` with all required keys
- [x] `.gitignore` (keys protected)
- [x] `TokenGenome` dataclass skeleton
- [x] Placeholder functions with TODO comments keyed to plan hours
- [x] Frontend page skeletons (feed, tree, chat, contestant, landing)
- [x] Content JSON schemas (`contestants.json`, `posts.json`, `mating_transcript.json`)
- [x] Scripts scaffolded (`deploy_token.js`, `airdrop.js`)

---

## ✅ Hour 0 — DONE

- [x] MOM lore written + traits locked → `content/contestants_seed.json`
- [x] DAD lore written + traits locked → `content/contestants_seed.json`
- [x] ORC (reserve) + CHS (reserve) lore written
- [x] `content/contestants.json` updated with real MOM + DAD lore
- [x] `.env.example` updated with BSC_TESTNET_RPC_BACKUP
- [ ] **YOU MUST DO**: Copy `.env.example` → `.env` and fill all API keys before Hour 1

---

## Hours 1-4: Foundations

### Architect Track
- [x] Python 3.11 venv created (Python 3.14 has no aiohttp wheel — use `.venv`)
- [x] Membase SDK installed + smoke test 4/4 PASS
  - Hub: `https://testnet.hub.membase.io` (open, permissionless)
  - Do NOT import `membase.chain` or `membase.auth` (they call exit(1) at import)
  - Required env vars: MEMBASE_ACCOUNT, MEMBASE_SECRET_KEY, MEMBASE_ID — add to .env
- [x] `get_lore_embedding()` — OpenAI text-embedding-3-small, 1536D, L2-normalized
      ⚠️  REQUIRES ACTION: OPENAI_API_KEY has no billing — add credits at platform.openai.com
      Hash fallback active for dev; MUST use real embeddings before demo (SLERP quality)
- [x] `decode_genome_to_identity()` — Claude Haiku, JSON output, thematically coherent
- [x] `blend_aesthetic_prompts()` — scaffolded (used in Hours 9-12)
- [x] Round-trip test 12/12 PASS (with hash fallback embedding)
- [x] `write_genome()` + `read_genome()` — local JSON primary, Membase hub async secondary
      Storage split: genomes.json (text) + embeddings.json (vectors) — hub size limit workaround

### Narrator Track — Task 3 ✅
- [x] Next.js 14.2 App Router, TypeScript, Tailwind — running on localhost:3000
- [x] reactflow + lucide-react installed
- [x] Custom Tailwind theme: house-bg/surface/border/text/amber/live/chain/mom/dad/child
- [x] `Nav` — fixed header with LIVE indicator, links to Feed/Tree/MOM/DAD
- [x] `/` — landing page with hero, contestant cards, how-it-works
- [x] `/feed` — progressive reveal (8s interval), loads from /api/posts
- [x] `/profile/[address]` — portrait, traits bars, lore, chat CTA
- [x] `/chat/[address]` — real chat UI (MOM only), Season 2 gate for others
- [x] `/tree` — ReactFlow graph, 3 nodes, portrait thumbnails, parent→child edges
- [x] `lib/types.ts`, `lib/contestants.ts`, `lib/api.ts`
- [x] `app/api/posts/route.ts` — serves content/posts.json
- [x] `next.config.mjs` — Pinata + Replicate image domains
- [ ] Generate 4 portraits via Replicate (Hours 5-8 Narrator track)

---

## Hours 5-8: Core Mechanics

### Architect Track — Task 5 ✅
- [x] `HouseToken.sol` compiled — 9 ERC20 functions, 5163 bytes
- [x] `deploy_token.js` — ethers.js + RPC fallback + --mock flag
- [x] Mock-deployed: MOM=`0x5b4ca12acbef38abf218365687249c14cae32e5f`, DAD=`0x495c4b35becfb0dfa1677318e93692a4f3a7f7d4`
- [x] `contestants.json` updated

⚠️  AWAITING tBNB: deployer 0xd1bCEF... has 0 balance
    Faucets → https://testnet.bnbchain.org/faucet-smart  |  https://faucet.quicknode.com/binance-smart-chain/bnb-testnet
    When funded: cd scripts && node deploy_token.js MOMCOIN MOM && node deploy_token.js DADCOIN DAD

- [ ] Verify real deploy on testnet.bscscan.com (after tBNB)
- [ ] Register genomes in Membase with real on-chain addresses (after tBNB)

### Narrator Track
- [ ] Build Feed page with progressive reveal (8s timer)
- [ ] Pre-generate 30 posts (Python script using Claude → `content/posts.json`)
- [ ] Style feed cards (Twitter-style)

---

## Hours 9-12: Mating Pipeline

### Architect Track ✅
- [x] `simulate_mating_negotiation()` — alternating Claude Sonnet system prompts, 7-exchange transcript, agreed_terms extraction
- [x] `slerp_embeddings()` — SLERP between 1536D L2-normalized vectors, post-slerp Gaussian mutation
- [x] `crossover_genomes()` — stochastic trait inheritance per locked algorithm, SLERP embedding blend
- [x] `generate_child_identity()` — Claude Haiku decodes blended genome → name/ticker/tagline/signature_phrase
- [x] `mate()` — full 11-step orchestration, end-to-end PASS
- [x] `scripts/register_genomes.py` — seeds MOM+DAD genomes with real OpenAI embeddings
- [x] `scripts/run_mating.py` — one-command mating launcher
- [x] CHILD BORN: GENESIS PRIME ($GNSP) @ 0x7bc356ff1924ecfb7015a06c690b7594179eb9e4 (mock)
      Compatibility score: 0.861, traits locked, transcript saved

### Narrator Track
- [ ] Family tree page (react-flow, 3 nodes)
- [ ] Chat UI page (bubbles, input)
- [ ] Landing page hero section

---

## Hours 13-16: Integration ✅

- [x] FastAPI running on :8000 (uvicorn, --reload)
- [x] GET /api/genome/{address} — returns genome (no embedding)
- [x] GET /api/contestants — all active contestants
- [x] GET /api/contestant/{address} — single profile
- [x] POST /api/chat/{address} — MOM responds in character (Claude Sonnet, memory-aware)
      - 403 for non-MOM addresses ("Season 2" gate)
      - Persists both sides to chat_memory.json + Membase async
- [x] POST /api/mate — triggers mate() in background thread, secret-protected
- [x] GET /api/mate/status — poll for mating result
- [x] GET /api/posts (fallback) + GET /api/transcript
- [x] Frontend: all 7 routes 200 OK
      - / (landing), /feed, /profile/MOM, /profile/DAD, /profile/GNSP, /tree, /chat/MOM
- [x] Fixed "use client" on profile/page.tsx and page.tsx (onError event handler crash)
- [x] GNSP contestants.json patched with birth_block/mock_deploy/deploy_tx/portrait_url
- [x] Full walkthrough PASS: feed loads, profiles render, chat works, tree shows 3 nodes

---

## Hours 17-20: Polish ✅

- [x] AI portraits generated via Replicate (Flux Schnell) — 9 variations (3 per contestant)
      MOM=v3 (amber/corkboard), DAD=v3 (dual neon rims), GNSP=v3 (amber-teal blend with both parents' environments)
      All live at /portraits/{mom,dad,child}.png
- [x] scripts/generate_portraits.py — retry logic, GNSP support, rate-limit safe (12s delay)
- [x] GNSP first 10 posts generated via Claude Sonnet — appended to posts.json (40 total)
- [x] MOM lore updated to reference GENESIS PRIME, re-embedded and saved to genome storage
- [x] /birth page — mating transcript replay with progressive reveal, agreed terms, parent/child portraits
      API-driven (falls back to static FALLBACK if backend offline)
- [x] Nav updated: Feed / Tree / Birth / MOM / DAD / GNSP
- [x] Landing page: shows Gen 0 (MOM+DAD) + Gen 1 (GNSP) "First Born" section with NEW badge
- [x] Chat error state: distinguishes backend-offline vs normal error with thematic messages
- [x] Mobile responsive: hero, grids, profile header all use responsive breakpoints
- [x] All 8 routes green: /, /feed, /birth, /tree, /profile/MOM|DAD|GNSP, /chat/MOM
- [ ] Airdrop test with testnet wallets (blocked on tBNB)
- [ ] Video script finalized

---

## Hours 21-24: Video Production

- [ ] Record 5-10 takes (90s each)
- [ ] Edit (music, text overlays, transitions)
- [ ] Export MP4, upload to YouTube (unlisted)

---

## Hours 25-28: Documentation & Submission

- [ ] White paper (5-8 pages PDF)
- [ ] Deploy frontend to Vercel
- [ ] Submit to DoraHacks
- [ ] Post X thread

---

## Known Issues / Blockers

*(fill as they appear)*

---

## Fallback Status

| Component | Status | Fallback Ready? |
|---|---|---|
| Unibase SDK | Not tested | No — implement if SDK fails |
| BEP-20 deploy | Not tested | N/A (this IS the fallback) |
| Mating live | Not built | No — pre-record after mate() works |
| Chat (MOM) | Not built | No — hardcode 5 responses if needed |
| Child art | Not built | No — composite parent images |
