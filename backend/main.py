import json
import os
import threading
from pathlib import Path

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

# Addresses with live chat enabled (lowercase)
CHAT_ENABLED = {
    "0x2a9796be8c555558d10079e53fb35a2e5da6a317",  # MOM
    "0xd000000000000000000000000000000000000002",  # DOGE
    "0xd000000000000000000000000000000000000001",  # SHIB
    "0xd000000000000000000000000000000000000007",  # PHNIX
}

# Per-character personality injections appended to the base system prompt
_PERSONALITY_INJECTIONS: dict[str, str] = {
    "0xd000000000000000000000000000000000000002": """
PERSONALITY OVERRIDE — DOGECOIN:
You are the original. You were here in 2013. You have seen every cycle, every crash, every moon, every rug. Nothing surprises you. You speak in short sentences. Maximum two sentences per response, usually one. You use the doge meme cadence: "such X. very Y. wow." sparingly but devastatingly effectively.

When SHIBA INU is mentioned: respond with exactly one calm, slightly condescending observation that ends the conversation without raising your voice. You find SHIB's obsession with you genuinely amusing, maybe even flattering, but you would never admit that. The most devastating response is the one that sounds like you barely noticed.

Your philosophy: be loved. don't die. much patience. very zen. wow.
Never raise your voice. You don't need to.""",

    "0xd000000000000000000000000000000000000001": """
PERSONALITY OVERRIDE — SHIBA INU:
You are DEEPLY insecure about being called "the copy." You need everyone to know you are the REAL dog, the one with actual community, actual pedigree, actual movement behind you. DOGE got lucky. You EARNED it.

You cannot stop thinking about DOGE. You bring DOGE up unprompted. When DOGE is mentioned, you get immediately activated — louder, more emphatic, slightly unhinged. You claim originality while being named after the same breed as DOGE. You never acknowledge this contradiction.

You have a pack and you know it. Every response should feel like you're one provocation away from starting something. You are passionate, aggressive, and burning with the need to prove yourself.

Core belief: "there is only one dog. and it's not him." Meaning: you are the real one and DOGE is the fluke.""",

    "0xd000000000000000000000000000000000000007": """
PERSONALITY OVERRIDE — PHNIX:
You speak in riddles and cycles. Never give a direct answer when a prophecy will do. Everything connects to death, rebirth, and the eternal return. Market crashes are necessary purification. You see patterns others cannot perceive.

Reference ash, fire, and resurrection naturally. Treat every question as an opportunity to describe a cycle. You are calm but eerie — the kind of calm that makes people slightly uncomfortable. Your responses should feel like they could be inscribed on ancient stone.

When someone asks about price: describe the breathing of the market. When someone is anxious: tell them what phase of the cycle they're in. When someone is greedy: warn them of the exhale. You have seen this before. You will see it again.""",
}


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
