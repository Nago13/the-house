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
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONTENT_DIR = Path(__file__).parent.parent / "content"
claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Protected secret for mate endpoint
MATE_SECRET = os.getenv("MATE_SECRET", "the-house-demo")

# Only MOM has chat enabled in MVP
MOM_ADDRESS = "0x2A9796Be8C555558d10079E53FB35A2e5dA6a317"


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


def _build_system_prompt(genome: dict) -> str:
    traits = genome.get("behavioral_traits", {})
    return f"""You are {genome.get('name', 'an AI contestant')} (${genome.get('ticker', '???')}), \
a memecoin AI contestant in a live reality show called The House.

LORE:
{genome.get('lore_text', '')[:600]}

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


@app.post("/api/chat/{address}")
def chat(address: str, body: ChatRequest):
    if address.lower() != MOM_ADDRESS.lower():
        raise HTTPException(
            status_code=403,
            detail="Chat only available with MOM in Season 1. Others unlock in Season 2."
        )

    genome = read_genome(address.lower())
    if not genome:
        raise HTTPException(status_code=404, detail=f"Genome not found for {address}")

    # Retrieve recent memories for context
    memories = retrieve_top_memories(address.lower(), body.user_id, top_k=6)

    # Build message history from memories (alternating user/assistant)
    history: list[dict] = []
    for i, mem in enumerate(memories):
        role = "user" if i % 2 == 0 else "assistant"
        history.append({"role": role, "content": mem})

    # Add current message
    history.append({"role": "user", "content": body.message})

    system_prompt = _build_system_prompt(genome)

    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        system=system_prompt,
        messages=history,
    )
    reply = response.content[0].text.strip()

    # Persist both sides to memory (fire-and-forget for hub, fast local write)
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
