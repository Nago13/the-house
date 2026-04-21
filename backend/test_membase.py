"""
Membase SDK smoke test — run before touching anything else.
Tests: write genome JSON → hub → download → verify round-trip.

Usage: python backend/test_membase.py
Expected: PASS on all 4 checks.
If any FAIL: activate Pinata IPFS fallback in unibase_client/client.py.
"""
import json
import sys
import os
from pathlib import Path

# Load .env from project root
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

# Import ONLY what we need — do NOT import membase.chain or membase.auth
# (those call exit(1) if MEMBASE_* env vars aren't set)
from membase.memory.buffered_memory import BufferedMemory
from membase.memory.message import Message
from membase.storage.hub import hub_client

TEST_ACCOUNT = "the-house-test"
TEST_CONVERSATION_ID = "smoke_test_genome_mom"

FAKE_GENOME = {
    "version": "1.0",
    "token_address": "0xTEST",
    "name": "MOMCOIN",
    "ticker": "MOM",
    "lore_text": "Test lore for smoke test.",
    "lore_embedding": [0.1, 0.2, 0.3],  # truncated — real is 1536D
    "aesthetic_prompt": "sepia tones, analog grain",
    "behavioral_traits": {
        "verbosity": 0.8,
        "aggression": 0.3,
        "humor_axis": 0.2,
        "sociability": 0.6,
        "volatility_response": 0.7,
    },
    "parents": [],
    "generation": 0,
    "birth_block": 0,
    "genesis_archetype": "Vintage conspiracy theorist",
    "signature_phrase": "before the feeds, there was the ground",
}


def check(label, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    print(f"  [{status}] {label}" + (f" — {detail}" if detail else ""))
    return condition


def run():
    print("\n=== Membase Smoke Test ===\n")
    results = []

    # 1. Write
    print("1. Writing genome to Membase hub...")
    try:
        mem = BufferedMemory(
            conversation_id=TEST_CONVERSATION_ID,
            membase_account=TEST_ACCOUNT,
            auto_upload_to_hub=True,
        )
        msg = Message(
            name="MOMCOIN",
            content=json.dumps(FAKE_GENOME),
            role="assistant",
            metadata={"type": "profile", "token_address": "0xTEST"},
            type="profile",
        )
        mem.add(msg)
        results.append(check("Message added to local buffer", mem.size() == 1))
        # Give the background upload thread a moment to complete
        hub_client.wait_for_upload_queue()
        results.append(check("Upload queue drained (no exception)", True))
    except Exception as e:
        results.append(check("Write step", False, str(e)))
        results.append(check("Upload queue", False, "skipped"))

    # 2. Download
    print("\n2. Downloading genome from Membase hub...")
    try:
        filename = f"{TEST_CONVERSATION_ID}_0"
        raw = hub_client.download_hub(TEST_ACCOUNT, filename)
        results.append(check("Raw bytes received from hub", raw is not None and len(raw) > 0,
                              f"{len(raw)} bytes" if raw else "None"))
    except Exception as e:
        raw = None
        results.append(check("Download step", False, str(e)))

    # 3. Deserialize
    print("\n3. Deserializing downloaded content...")
    try:
        if raw:
            parsed = json.loads(raw.decode("utf-8"))
            # The hub stores the full Message serialized as JSON
            content_str = parsed.get("message", raw.decode("utf-8"))
            if isinstance(content_str, str):
                msg_dict = json.loads(content_str)
            else:
                msg_dict = content_str

            genome_back = json.loads(msg_dict.get("content", "{}"))
            results.append(check(
                "Genome round-trip matches",
                genome_back.get("ticker") == "MOM" and genome_back.get("version") == "1.0",
                f"ticker={genome_back.get('ticker')}, version={genome_back.get('version')}"
            ))
        else:
            results.append(check("Deserialize step", False, "no raw data"))
    except Exception as e:
        results.append(check("Deserialize step", False, str(e)))

    # Summary
    passed = sum(results)
    total = len(results)
    print(f"\n=== Result: {passed}/{total} checks passed ===")
    if passed < total:
        print("\nACTION REQUIRED: Activate Pinata IPFS fallback in backend/unibase_client/client.py")
        sys.exit(1)
    else:
        print("Membase is operational. Proceed to Hour 1 Task 2 (embedding pipeline).")
        sys.exit(0)


if __name__ == "__main__":
    run()
