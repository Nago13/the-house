"""
Generate contestant portraits via Replicate API (Flux Schnell).
Generates 3 variations per contestant, saves to frontend/public/portraits/.

Usage: python scripts/generate_portraits.py [--contestant MOM|DAD|GNSP|all]
Requires: REPLICATE_API_TOKEN in .env
Cost: ~$0.003 per image × 9 images = ~$0.027 total

Rate limit when < $5 credit: 6 req/min burst=1. Script waits automatically.
"""
import os
import sys
import json
import time
import requests
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

import replicate

SEED_FILE       = Path(__file__).parent.parent / "content" / "contestants_seed.json"
CONTESTANTS_FILE = Path(__file__).parent.parent / "content" / "contestants.json"
OUTPUT_DIR      = Path(__file__).parent.parent / "frontend" / "public" / "portraits"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL = "black-forest-labs/flux-schnell"
SEEDS = [42, 137, 999]

# Seconds between requests — conservative for low-credit rate limit (6 req/min burst=1)
REQUEST_DELAY   = 12
MAX_RETRIES     = 4
RETRY_BACKOFF   = [15, 30, 60, 120]   # seconds per retry attempt


def generate_portrait(name: str, ticker: str, aesthetic_prompt: str,
                      variation: int, gender_hint: str = "person") -> str | None:
    """Run one Flux Schnell inference with retry logic. Returns local saved path or None."""
    seed = SEEDS[variation]
    prompt = (
        f"Professional portrait photograph. {aesthetic_prompt}. "
        f"Subject is {gender_hint} who embodies the archetype. "
        f"High detail, cinematic lighting, editorial quality. "
        f"NOT a cartoon or illustration — photorealistic."
    )

    for attempt in range(MAX_RETRIES):
        print(f"  [{ticker} v{variation+1}] seed={seed} attempt={attempt+1} — generating...")
        t0 = time.time()
        try:
            output = replicate.run(
                MODEL,
                input={
                    "prompt":              prompt,
                    "num_inference_steps": 4,
                    "guidance":            3.5,
                    "width":               768,
                    "height":              1024,
                    "seed":                seed,
                    "output_format":       "png",
                    "output_quality":      95,
                }
            )
            img_url = str(output[0]) if isinstance(output, list) else str(output)
            elapsed = time.time() - t0
            print(f"  [{ticker} v{variation+1}] done in {elapsed:.1f}s — {img_url[:60]}...")

            img_bytes = requests.get(img_url, timeout=30).content
            out_path = OUTPUT_DIR / f"{ticker.lower()}_v{variation+1}.png"
            out_path.write_bytes(img_bytes)
            print(f"  [{ticker} v{variation+1}] saved -> {out_path}")
            return str(out_path)

        except Exception as e:
            err = str(e)
            if "402" in err or "Insufficient credit" in err:
                wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF)-1)]
                print(f"  [{ticker} v{variation+1}] 402 credit not yet active — waiting {wait}s...")
                time.sleep(wait)
            elif "429" in err or "throttled" in err or "rate limit" in err.lower():
                wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF)-1)]
                print(f"  [{ticker} v{variation+1}] 429 rate limited — waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  [{ticker} v{variation+1}] FAILED (no retry): {err}")
                return None

    print(f"  [{ticker} v{variation+1}] EXHAUSTED retries")
    return None


def build_contestant_list(filter_ticker: str | None) -> list[dict]:
    """Build the list of contestants to generate, including GNSP from contestants.json."""
    seed_data = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    all_data  = json.loads(CONTESTANTS_FILE.read_text(encoding="utf-8"))

    # Merge: seed contestants + any gen-1 entries from contestants.json
    by_ticker: dict[str, dict] = {}
    for c in seed_data:
        if not c.get("_status"):  # skip reserves
            by_ticker[c["ticker"]] = {
                "name":             c["name"],
                "ticker":           c["ticker"],
                "aesthetic_prompt": c["aesthetic_prompt"],
                "gender_hint":      "a woman" if c["ticker"] == "MOM" else "a man",
            }

    # Add gen-1 children (GNSP etc.)
    for c in all_data:
        if c.get("generation", 0) >= 1 and c.get("token_address") and c["token_address"] != "DEPLOY_PENDING":
            by_ticker[c["ticker"]] = {
                "name":             c["name"],
                "ticker":           c["ticker"],
                "aesthetic_prompt": c["aesthetic_prompt"],
                "gender_hint":      "a young person, gender-neutral",
            }

    contestants = list(by_ticker.values())
    if filter_ticker and filter_ticker != "ALL":
        contestants = [c for c in contestants if c["ticker"] == filter_ticker]
    return contestants


def main():
    filter_ticker = None
    if "--contestant" in sys.argv:
        idx = sys.argv.index("--contestant")
        if idx + 1 < len(sys.argv):
            filter_ticker = sys.argv[idx + 1].upper()

    contestants = build_contestant_list(filter_ticker)

    print(f"\n=== Portrait Generation ===")
    print(f"Contestants: {[c['ticker'] for c in contestants]}")
    print(f"Variations per contestant: {len(SEEDS)}")
    print(f"Estimated cost: ~${0.003 * len(contestants) * len(SEEDS):.3f}")
    print(f"Output dir: {OUTPUT_DIR}")
    print(f"Request delay: {REQUEST_DELAY}s (low-credit rate limit safety)\n")

    results = {}
    for c in contestants:
        ticker = c["ticker"]
        print(f"\n-- {c['name']} ({ticker}) --")
        paths = []
        for i in range(len(SEEDS)):
            path = generate_portrait(
                c["name"], ticker, c["aesthetic_prompt"], i, c["gender_hint"]
            )
            if path:
                paths.append(path)
            if i < len(SEEDS) - 1:
                print(f"  [rate-limit pause {REQUEST_DELAY}s]")
                time.sleep(REQUEST_DELAY)
        results[ticker] = paths
        if ticker != contestants[-1]["ticker"]:
            print(f"  [inter-contestant pause {REQUEST_DELAY}s]")
            time.sleep(REQUEST_DELAY)

    print("\n=== Done ===")
    all_ok = True
    for ticker, paths in results.items():
        status = "OK" if len(paths) == len(SEEDS) else f"PARTIAL {len(paths)}/{len(SEEDS)}"
        print(f"\n{ticker}: {status}")
        for p in paths:
            print(f"  {p}")
        if not paths:
            all_ok = False

    if all_ok:
        print("\nNext: pick best variation and copy to canonical name:")
        for ticker in results:
            out_name = "child" if ticker not in ("MOM", "DAD") else ticker.lower()
            print(f"  copy portraits/{ticker.lower()}_v1.png -> portraits/{out_name}.png")
    else:
        print("\nSome portraits failed. Check REPLICATE_API_TOKEN and billing status.")
        print("Re-run: python scripts/generate_portraits.py")


if __name__ == "__main__":
    main()
