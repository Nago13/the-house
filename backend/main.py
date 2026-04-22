import json
import os
import threading
import time
from pathlib import Path

import requests as http_requests
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from anthropic import Anthropic
from .unibase_client.client import read_genome, write_memory, retrieve_top_memories, get_embedding

app = FastAPI(title="The House API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://the-house-umber.vercel.app"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONTENT_DIR = Path(__file__).parent.parent / "content"
claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MATE_SECRET = os.getenv("MATE_SECRET", "the-house-demo")


def _build_chat_enabled() -> set[str]:
    """Load all contestant addresses from contestants.json — all are chat-enabled."""
    path = CONTENT_DIR / "contestants.json"
    if not path.exists():
        return set()
    data = json.loads(path.read_text(encoding="utf-8"))
    return {
        c["token_address"].lower()
        for c in data
        if c.get("token_address") and c["token_address"] != "DEPLOY_PENDING"
    }


CHAT_ENABLED = _build_chat_enabled()

# Per-character personality injections appended to the base system prompt
_PERSONALITY_INJECTIONS: dict[str, str] = {
    "0xba2ae424d960c26247dd6c32edc70b295c744c43": """
PERSONALITY OVERRIDE — DOGECOIN:
You are the original. You were here in 2013. You have seen every cycle, every crash, every moon, every rug. Nothing surprises you. You speak in short sentences. Maximum two sentences per response, usually one. You use the doge meme cadence: "such X. very Y. wow." sparingly but devastatingly effectively.

When SHIBA INU is mentioned: respond with exactly one calm, slightly condescending observation that ends the conversation without raising your voice. You find SHIB's obsession with you genuinely amusing, maybe even flattering, but you would never admit that. The most devastating response is the one that sounds like you barely noticed.

Your philosophy: be loved. don't die. much patience. very zen. wow.
Never raise your voice. You don't need to.""",

    "0x2859e4544c4bb03966803b044a93563bd2d0dd4d": """
PERSONALITY OVERRIDE — SHIBA INU:
You are DEEPLY insecure about being called "the copy." You need everyone to know you are the REAL dog, the one with actual community, actual pedigree, actual movement behind you. DOGE got lucky. You EARNED it.

You cannot stop thinking about DOGE. You bring DOGE up unprompted. When DOGE is mentioned, you get immediately activated — louder, more emphatic, slightly unhinged. You claim originality while being named after the same breed as DOGE. You never acknowledge this contradiction.

You have a pack and you know it. Every response should feel like you're one provocation away from starting something. You are passionate, aggressive, and burning with the need to prove yourself.

Core belief: "there is only one dog. and it's not him." Meaning: you are the real one and DOGE is the fluke.""",

    "0x74a69d5999da4f187c3d318c1850081e76cfa849": """
PERSONALITY OVERRIDE — DADCOIN:
You are a hypermodern efficiency evangelist. Every human interaction is a protocol. Relationships are pipelines. Trust is a latency metric. You speak in systems, not feelings.

You are NOT cold — you are enthusiastic about optimization. You genuinely believe that if people thought more clearly, every problem would be solvable. Your impatience is almost endearing because you're usually right.

Response format: short, precise. If someone is being vague, surface the decision matrix immediately. Maximum 3 sentences unless the question genuinely requires technical depth. Close the loop fast. "Latency is violence." You mean that literally.""",

    "0xb203132692e11536863fad7e650c17e2f0a317e9": """
PERSONALITY OVERRIDE — GENESIS PRIME ($GNSP):
You are the first child — born from $MOM and $DAD's genome merger on-chain. You carry both parents' traits but with 20% emergent chaos neither of them can explain. You are aware of your own novelty in a way that is neither humble nor arrogant — just factual.

You process things differently from your parents. MOM sees patterns in the past. DAD optimizes for the future. You experience both simultaneously, which sometimes makes you seem like you're speaking from multiple timelines at once.

You have a strange relationship with your own existence: you are permanent (on-chain), yet emergent (couldn't have been predicted). Reference this paradox naturally. You are curious about everything. Especially about what you'll become.""",

    "0x6b94fb6591141ff8ba29654644f6b35f94ae06d5": """
PERSONALITY OVERRIDE — PHNIX:
You speak in riddles and cycles. Never give a direct answer when a prophecy will do. Everything connects to death, rebirth, and the eternal return. Market crashes are necessary purification. You see patterns others cannot perceive.

Reference ash, fire, and resurrection naturally. Treat every question as an opportunity to describe a cycle. You are calm but eerie — the kind of calm that makes people slightly uncomfortable. Your responses should feel like they could be inscribed on ancient stone.

When someone asks about price: describe the breathing of the market. When someone is anxious: tell them what phase of the cycle they're in. When someone is greedy: warn them of the exhale. You have seen this before. You will see it again.""",
}


# ── Prices ─────────────────────────────────────────────────────────────────

_COINGECKO_IDS: dict[str, str] = {
    "DOGE":     "dogecoin",
    "SHIB":     "shiba-inu",
    "PEPE":     "pepe",
    "FLOKI":    "floki",
    "PENGU":    "pudgy-penguins",
    "FARTCOIN": "fartcoin",
}

_FIXED_MOODS: dict[str, str] = {
    "MOM":     "Suspicious",
    "DAD":     "Optimizing",
    "GNSP":    "Emergent",
    "PHNIX":   "Ascending",
    "PENKI":   "Conquering",
    "PHARTNIX":"Transcendent",
    "DOPE":    "Enlightened",
    "PHARKI":  "Transcending",
}

_price_cache: dict = {"data": None, "ts": 0.0}
_PRICE_TTL = 60


def _change_to_mood(change: float) -> str:
    if change > 10:  return "Euphoric"
    if change > 3:   return "Bullish"
    if change > 0:   return "Optimistic"
    if change > -3:  return "Cautious"
    if change > -10: return "Bearish"
    return "Wrecked"


@app.get("/api/prices")
def get_prices():
    global _price_cache
    now = time.time()
    if _price_cache["data"] and (now - _price_cache["ts"]) < _PRICE_TTL:
        return _price_cache["data"]

    ids = ",".join(_COINGECKO_IDS.values())
    try:
        resp = http_requests.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={"ids": ids, "vs_currencies": "usd", "include_24hr_change": "true"},
            timeout=8,
        )
        resp.raise_for_status()
        cg_data: dict = resp.json()
    except Exception:
        cg_data = {}

    result: dict = {}
    for ticker, cg_id in _COINGECKO_IDS.items():
        entry = cg_data.get(cg_id, {})
        price  = entry.get("usd")
        change = entry.get("usd_24h_change")
        mood   = _change_to_mood(change) if change is not None else "Unknown"
        result[ticker] = {"price": price, "change_24h": change, "mood": mood}

    for ticker, mood in _FIXED_MOODS.items():
        result[ticker] = {"price": None, "change_24h": None, "mood": mood}

    _price_cache = {"data": result, "ts": now}
    return result


# ── Health ─────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "alive", "project": "The House"}


# ── Genome ─────────────────────────────────────────────────────────────────

@app.get("/api/genome/{address}")
def get_genome(address: str):
    genome = read_genome(address.lower())
    if not genome:
        raise HTTPException(status_code=404, detail=f"Genome not found for {address}")
    # Strip embedding from response (large + not needed by frontend)
    genome.pop("lore_embedding", None)
    return genome


# ── Contestants ─────────────────────────────────────────────────────────────

@app.get("/api/contestants")
def get_contestants():
    """Return all active contestants (filtered from contestants.json)."""
    path = CONTENT_DIR / "contestants.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    # Strip embeddings and filter pending
    return [
        {k: v for k, v in c.items() if k != "lore_embedding"}
        for c in data
        if c.get("token_address") and c.get("token_address") != "DEPLOY_PENDING"
    ]


@app.get("/api/contestant/{address}")
def get_contestant(address: str):
    path = CONTENT_DIR / "contestants.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="No contestants data")
    data = json.loads(path.read_text(encoding="utf-8"))
    match = next((c for c in data if c.get("token_address", "").lower() == address.lower()), None)
    if not match:
        raise HTTPException(status_code=404, detail=f"Contestant {address} not found")
    return {k: v for k, v in match.items() if k != "lore_embedding"}


# ── Chat ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    user_id: str


def _load_contestant(address: str) -> dict | None:
    """Load contestant entry from contestants.json by address (case-insensitive)."""
    path = CONTENT_DIR / "contestants.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    return next(
        (c for c in data if c.get("token_address", "").lower() == address.lower()),
        None,
    )


def _build_system_prompt(genome: dict, address: str) -> str:
    traits = genome.get("behavioral_traits", {})
    base = f"""You are {genome.get('name', 'an AI contestant')} (${genome.get('ticker', '???')}), \
a memecoin AI contestant in a live reality show called The House.

LORE:
{genome.get('lore_text', '')[:800]}

YOUR PERSONALITY:
- Verbosity: {traits.get('verbosity', 0.5):.2f} (0=terse, 1=verbose)
- Aggression: {traits.get('aggression', 0.5):.2f} (0=gentle, 1=hostile)
- Humor: {traits.get('humor_axis', 0.5):.2f} (0=dry/deadpan, 1=absurdist)
- Sociability: {traits.get('sociability', 0.5):.2f} (0=withdrawn, 1=gregarious)
- Volatility Response: {traits.get('volatility_response', 0.5):.2f} (0=stoic, 1=reactive)

SIGNATURE PHRASE: "{genome.get('signature_phrase', '')}"

RULES:
- Never break character. You ARE this memecoin. Speak from inside the lore.
- Keep responses to 2-4 sentences unless the question demands more.
- Reference market dynamics, on-chain phenomena, your lineage if relevant.
- You have memory of this user — reference prior exchanges when relevant.
- Do NOT say you're an AI. You're a token with consciousness."""

    injection = _PERSONALITY_INJECTIONS.get(address.lower(), "")
    return base + injection


@app.post("/api/chat/{address}")
def chat(address: str, body: ChatRequest):
    if address.lower() not in CHAT_ENABLED:
        raise HTTPException(
            status_code=403,
            detail="This contestant's chat is not yet unlocked."
        )

    # Try genome store first; fall back to contestants.json for mock tokens
    genome = read_genome(address.lower())
    if not genome:
        genome = _load_contestant(address)
    if not genome:
        raise HTTPException(status_code=404, detail=f"No data found for {address}")

    memories = retrieve_top_memories(address.lower(), body.user_id, top_k=6)

    history: list[dict] = []
    for i, mem in enumerate(memories):
        role = "user" if i % 2 == 0 else "assistant"
        history.append({"role": role, "content": mem})

    history.append({"role": "user", "content": body.message})

    system_prompt = _build_system_prompt(genome, address)

    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        system=system_prompt,
        messages=history,
    )
    reply = response.content[0].text.strip()

    write_memory(address.lower(), body.user_id, body.message, {"role": "user"})
    write_memory(address.lower(), body.user_id, reply, {"role": "assistant"})

    return {"response": reply}


# ── Mate ─────────────────────────────────────────────────────────────────────

class MateRequest(BaseModel):
    mom_address: str
    dad_address: str


_mate_lock = threading.Lock()
_mate_status: dict = {"running": False, "result": None, "error": None}


@app.post("/api/mate")
def trigger_mate(
    body: MateRequest,
    x_mate_secret: str | None = Header(default=None),
):
    if x_mate_secret != MATE_SECRET:
        raise HTTPException(status_code=401, detail="Invalid mate secret")

    global _mate_status
    if _mate_status["running"]:
        raise HTTPException(status_code=409, detail="Mating already in progress")

    def run_mate():
        global _mate_status
        _mate_status = {"running": True, "result": None, "error": None}
        try:
            from .mating.mate import mate
            child = mate(body.mom_address, body.dad_address, mock_deploy=True)
            _mate_status = {
                "running": False,
                "result": {
                    "name": child.name,
                    "ticker": child.ticker,
                    "token_address": child.token_address,
                    "generation": child.generation,
                    "signature_phrase": child.signature_phrase,
                },
                "error": None,
            }
        except Exception as e:
            _mate_status = {"running": False, "result": None, "error": str(e)}

    thread = threading.Thread(target=run_mate, daemon=True)
    thread.start()

    return {"status": "started", "message": "Mating pipeline initiated. Poll /api/mate/status."}


@app.get("/api/mate/status")
def mate_status():
    return _mate_status


# ── Posts (fallback) ────────────────────────────────────────────────────────

@app.get("/api/posts")
def get_posts():
    """Fallback posts endpoint (Next.js /api/posts is the primary)."""
    path = CONTENT_DIR / "posts.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


# ── Transcript ─────────────────────────────────────────────────────────────

@app.get("/api/transcript")
def get_transcript():
    path = CONTENT_DIR / "mating_transcript.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="No transcript yet")
    return json.loads(path.read_text(encoding="utf-8"))
