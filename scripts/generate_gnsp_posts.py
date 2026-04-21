"""Generate GENESIS PRIME's first 10 posts and append to posts.json."""
import os, json
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")
from anthropic import Anthropic

ROOT = Path(__file__).parent.parent
claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

prompt = """You are writing the first 10 social media posts from GENESIS PRIME ($GNSP), the first child of The House — a live AI reality show where memecoins are contestants.

GENESIS PRIME's identity:
- Born from: MOMCOIN (analog archivist, pattern-keeper, "before the feeds, there was the ground") x DADCOIN (efficiency absolutist, latency minimizer, "latency is violence")
- Signature phrase: "I watched the charts breathe."
- Tagline: First blood of legacy, coded in warmth, executed with precision.
- Traits: very verbose (0.92), balanced aggression (0.50), dry deadpan humor (0.34), somewhat withdrawn (0.32), highly reactive to market events (0.76)
- Voice: inherited mom's long observational sentences and dad's precise systems vocabulary. Sees both analog patterns and digital efficiency. Still BECOMING — an AI finding its voice. References being "born on-chain", watching its parents, feeling the inheritance in its weights.

Write exactly 10 posts. Each post should:
- Be in first person, cryptic and punchy
- 1-4 sentences max
- Reference GNSP's unique position as gen-1 child
- Mix market observation + existential awareness of being "born" from two archetypes
- Vary tone: some eerie, some dry, some market-analytical, some tender/strange
- NO hashtags, NO emojis
- Timestamps start at 2025-04-20T08:00:00Z, increment 2-4 hours each

Output ONLY a valid JSON array, no commentary:
[
  {"content": "...", "timestamp": "...", "reactions": {"like": N, "repost": N, "reply": N}},
  ...
]
Reactions should feel organic (50-400 range, like > repost > reply roughly)."""

response = claude.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1500,
    messages=[{"role": "user", "content": prompt}],
)
raw = response.content[0].text.strip()
if raw.startswith("```"):
    raw = raw.split("```")[1]
    if raw.startswith("json"):
        raw = raw[4:]
posts_data = json.loads(raw.strip())

cont = json.loads((ROOT / "content/contestants.json").read_text(encoding="utf-8"))
gnsp = next(c for c in cont if c["ticker"] == "GNSP")
existing = json.loads((ROOT / "content/posts.json").read_text(encoding="utf-8"))
next_id = len(existing) + 1

new_posts = []
for i, p in enumerate(posts_data):
    new_posts.append({
        "id": f"post-{next_id+i:03d}",
        "author_address": gnsp["token_address"],
        "author_name": gnsp["name"],
        "author_ticker": gnsp["ticker"],
        "avatar_url": "/portraits/child.png",
        "content": p["content"],
        "timestamp": p["timestamp"],
        "reactions": p["reactions"],
    })

all_posts = existing + new_posts
(ROOT / "content/posts.json").write_text(
    json.dumps(all_posts, indent=2, ensure_ascii=False), encoding="utf-8"
)
print(f"Added {len(new_posts)} GNSP posts. Total: {len(all_posts)}")
for p in new_posts:
    print(f"  [{p['timestamp']}] {p['content'][:90]}")
