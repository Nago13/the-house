"""
Embedding pipeline round-trip test.
lore_text → embed → write Membase → read Membase → decode identity → verify coherence

Usage: python backend/test_embedding_pipeline.py
"""
import json
import sys
import math
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.genome.embedding import get_lore_embedding, decode_genome_to_identity
from backend.unibase_client.client import write_genome, read_genome

CONTESTANTS_FILE = Path(__file__).parent.parent / "content" / "contestants.json"


def check(label, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    print(f"  [{status}] {label}" + (f" — {detail}" if detail else ""))
    return condition


def l2_norm(v: list[float]) -> float:
    return math.sqrt(sum(x * x for x in v))


def run():
    print("\n=== Embedding Pipeline Round-Trip Test ===\n")
    results = []

    # Load MOM from contestants.json
    contestants = json.loads(CONTESTANTS_FILE.read_text(encoding="utf-8"))
    mom = next(c for c in contestants if c["ticker"] == "MOM")
    lore_text = mom["lore_text"]
    traits = mom["behavioral_traits"]
    aesthetic = mom["aesthetic_prompt"]

    # ── Step 1: Embed ────────────────────────────────────────────────────────
    print("1. Embedding MOM lore_text via OpenAI text-embedding-3-small...")
    try:
        embedding = get_lore_embedding(lore_text)
        results.append(check("Embedding returned", embedding is not None))
        results.append(check("Dimension is 1536", len(embedding) == 1536, f"got {len(embedding)}"))
        norm = l2_norm(embedding)
        results.append(check(
            "Vector is L2-normalized (required for SLERP)",
            abs(norm - 1.0) < 1e-4,
            f"norm={norm:.6f}"
        ))
        print(f"    sample values: {embedding[:5]}")
    except Exception as e:
        embedding = None
        results += [check("Embedding", False, str(e))] * 3

    # ── Step 2: Write genome to Membase ──────────────────────────────────────
    print("\n2. Writing genome (with real embedding) to Membase...")
    test_addr = "0xMOM_EMBED_TEST"
    genome = {
        "version": "1.0",
        "token_address": test_addr,
        "name": mom["name"],
        "ticker": mom["ticker"],
        "lore_text": lore_text,
        "lore_embedding": embedding or [],
        "aesthetic_prompt": aesthetic,
        "behavioral_traits": traits,
        "parents": [],
        "generation": 0,
        "birth_block": 0,
        "genesis_archetype": mom["genesis_archetype"],
        "signature_phrase": mom["signature_phrase"],
    }
    try:
        ok = write_genome(test_addr, genome)
        results.append(check("Genome written to Membase", ok))
    except Exception as e:
        results.append(check("Write genome", False, str(e)))

    # ── Step 3: Read back from Membase ───────────────────────────────────────
    print("\n3. Reading genome back from Membase...")
    try:
        recovered = read_genome(test_addr)
        results.append(check("Genome retrieved", recovered is not None))
        if recovered:
            emb_back = recovered.get("lore_embedding", [])
            results.append(check(
                "Embedding survived serialization (1536D)",
                len(emb_back) == 1536,
                f"got {len(emb_back)} dims"
            ))
            results.append(check(
                "Ticker intact after round-trip",
                recovered.get("ticker") == "MOM",
                f"got {recovered.get('ticker')}"
            ))
    except Exception as e:
        results += [check("Read genome", False, str(e))] * 3
        recovered = None

    # ── Step 4: Decode identity via Claude ───────────────────────────────────
    print("\n4. Decoding genome identity via Claude Haiku...")
    try:
        identity = decode_genome_to_identity(lore_text, traits, aesthetic)
        print(f"    Generated identity: {json.dumps(identity, indent=4)}")

        results.append(check("Identity returned", identity is not None))
        results.append(check(
            "ticker is 2-6 uppercase chars",
            isinstance(identity.get("ticker"), str)
            and 2 <= len(identity["ticker"]) <= 6
            and identity["ticker"].isupper(),
            f"got '{identity.get('ticker')}'"
        ))
        results.append(check("name is non-empty", bool(identity.get("name")), f"got '{identity.get('name')}'"))
        results.append(check("tagline is non-empty", bool(identity.get("tagline"))))
        results.append(check("signature_phrase is non-empty", bool(identity.get("signature_phrase"))))
    except Exception as e:
        results += [check("Decode identity", False, str(e))] * 5

    # ── Summary ──────────────────────────────────────────────────────────────
    passed = sum(results)
    total = len(results)
    print(f"\n=== Result: {passed}/{total} checks passed ===")
    if passed < total:
        print("INVESTIGATE failures before proceeding.")
        sys.exit(1)
    else:
        print("Embedding pipeline operational. Ready for genome.py full implementation.")
        sys.exit(0)


if __name__ == "__main__":
    run()
