import json
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent.parent / ".env")

from openai import OpenAI
from anthropic import Anthropic

oai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

EMBED_MODEL = "text-embedding-3-small"   # 1536D, cheap
DECODE_MODEL = "claude-haiku-4-5-20251001"  # quick tasks
BLEND_MODEL = "claude-haiku-4-5-20251001"


def get_lore_embedding(lore_text: str) -> list[float]:
    """Embed lore_text using OpenAI text-embedding-3-small → 1536D vector.
    Falls back to a deterministic hash-based pseudo-embedding if OpenAI quota is exceeded.
    IMPORTANT: hash fallback is for dev/test only — replace with real embeddings before demo.
    Cosine similarity between hash embeddings is meaningless.
    """
    try:
        response = oai.embeddings.create(model=EMBED_MODEL, input=lore_text)
        return response.data[0].embedding
    except Exception as e:
        if "insufficient_quota" in str(e) or "429" in str(e):
            print(f"[WARNING] OpenAI quota exceeded — using hash fallback embedding. Add billing at platform.openai.com")
            return _hash_embedding_fallback(lore_text, dims=1536)
        raise


def _hash_embedding_fallback(text: str, dims: int = 1536) -> list[float]:
    """Deterministic pseudo-embedding for dev when OpenAI is unavailable.
    Normalized to unit length so SLERP math doesn't break.
    NOT semantically meaningful — only for structural testing.
    """
    import hashlib
    import math
    seed = hashlib.sha256(text.encode()).digest()
    # Expand seed to `dims` floats using repeated hashing
    values = []
    for i in range(0, dims, 32):
        block = hashlib.sha256(seed + i.to_bytes(4, "big")).digest()
        for b in block:
            values.append((b / 127.5) - 1.0)  # -1.0 to 1.0
    values = values[:dims]
    norm = math.sqrt(sum(x * x for x in values))
    return [x / norm for x in values]


def decode_genome_to_identity(
    lore_text: str,
    behavioral_traits: dict[str, float],
    aesthetic_prompt: str,
    parent_names: list[str] | None = None,
) -> dict:
    """
    Ask Claude to generate a memecoin identity from a contestant's textual genome.
    Returns {name, ticker, tagline, signature_phrase}.

    Used for:
    - Validating seed contestants (should reflect their lore)
    - Generating the child's identity after crossover (parent_names provided)
    """
    traits_desc = _traits_to_prose(behavioral_traits)
    lineage = ""
    if parent_names:
        lineage = f"\nThis contestant is the child of: {', '.join(parent_names)}."

    prompt = f"""You are naming a memecoin contestant for an AI reality show called The House.
Given this contestant's personality and background, generate their identity.

LORE:
{lore_text}

VISUAL STYLE: {aesthetic_prompt}

PERSONALITY: {traits_desc}{lineage}

Respond with ONLY valid JSON, no commentary:
{{
  "name": "<full name, 1-2 words, all caps, evocative>",
  "ticker": "<3-5 chars, all caps, derived from name>",
  "tagline": "<one memorable sentence that captures their worldview, under 15 words>",
  "signature_phrase": "<their catchphrase, 3-8 words, first person, cryptic or punchy>"
}}"""

    response = claude.messages.create(
        model=DECODE_MODEL,
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def blend_aesthetic_prompts(mom_prompt: str, dad_prompt: str) -> str:
    """
    Claude blends two parent aesthetic prompts into a child's visual style prompt.
    Called during mating (Hours 9-12).
    """
    response = claude.messages.create(
        model=BLEND_MODEL,
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": (
                f"Blend these two visual style prompts for a portrait into ONE unified prompt "
                f"for a child who inherits elements from both parents. "
                f"Output ONLY the blended prompt, no commentary.\n\n"
                f"PARENT A: {mom_prompt}\n\nPARENT B: {dad_prompt}"
            )
        }],
    )
    return response.content[0].text.strip()


# ── helpers ──────────────────────────────────────────────────────────────────

def _traits_to_prose(traits: dict[str, float]) -> str:
    """Convert 0-1 trait scores to natural language description."""
    lines = []
    v = traits.get("verbosity", 0.5)
    if v > 0.7:
        lines.append("verbose and expansive in communication")
    elif v < 0.3:
        lines.append("terse, minimal, one-sentence responses")
    else:
        lines.append("moderately expressive")

    a = traits.get("aggression", 0.5)
    if a > 0.7:
        lines.append("hostile and confrontational")
    elif a < 0.3:
        lines.append("gentle and non-confrontational")
    else:
        lines.append("assertive but measured")

    h = traits.get("humor_axis", 0.5)
    if h > 0.7:
        lines.append("absurdist and surreal humor")
    elif h < 0.3:
        lines.append("dry, deadpan humor or none")
    else:
        lines.append("balanced wit")

    s = traits.get("sociability", 0.5)
    if s > 0.7:
        lines.append("highly social and gregarious")
    elif s < 0.3:
        lines.append("isolated and self-contained")
    else:
        lines.append("selectively social")

    vr = traits.get("volatility_response", 0.5)
    if vr > 0.7:
        lines.append("extremely reactive to price action and market events")
    elif vr < 0.3:
        lines.append("stoic and unmoved by market volatility")
    else:
        lines.append("moderately sensitive to market moves")

    return "; ".join(lines)
