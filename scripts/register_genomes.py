"""
Register MOM and DAD genomes into local storage + Membase hub.
Run once before the mating pipeline — or whenever genomes.json is stale.

Usage: python scripts/register_genomes.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

SEED_FILE = ROOT / "content" / "contestants_seed.json"
CONTESTANTS_FILE = ROOT / "content" / "contestants.json"


def main():
    print("=== Registering Genomes ===\n")

    seed_data = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    contestants = json.loads(CONTESTANTS_FILE.read_text(encoding="utf-8"))

    # Build address lookup from active contestants.json
    addr_map = {c["ticker"]: c["token_address"] for c in contestants}

    # Only register seed contestants (MOM, DAD) — not reserves
    seed_contestants = [c for c in seed_data if not c.get("_status")]

    from backend.genome.embedding import get_lore_embedding
    from backend.unibase_client.client import write_genome

    for c in seed_contestants:
        ticker = c["ticker"]
        addr = addr_map.get(ticker)
        if not addr or addr == "DEPLOY_PENDING":
            print(f"[SKIP] {ticker} — no address in contestants.json")
            continue

        print(f"[{ticker}] Embedding lore...")
        embedding = get_lore_embedding(c["lore_text"])
        print(f"[{ticker}] Embedding dims: {len(embedding)}")

        genome_dict = {
            "version": "1.0",
            "token_address": addr,
            "name": c["name"],
            "ticker": ticker,
            "lore_text": c["lore_text"],
            "lore_embedding": embedding,
            "aesthetic_prompt": c["aesthetic_prompt"],
            "behavioral_traits": c["behavioral_traits"],
            "parents": [],
            "generation": 0,
            "birth_block": 0,
            "genesis_archetype": c.get("genesis_archetype"),
            "signature_phrase": c.get("signature_phrase", ""),
        }
        ok = write_genome(addr, genome_dict)
        print(f"[{ticker}] write_genome -> {'OK' if ok else 'FAILED'}")
        print(f"[{ticker}] address: {addr}\n")

    print("=== Done ===")
    print("Run: python scripts/run_mating.py")


if __name__ == "__main__":
    main()
