"""
Run the full mating pipeline — MOM + DAD -> CHILD.
This is the live demo centerpiece.

Usage:
  python scripts/run_mating.py              # mock deploy (default)
  python scripts/run_mating.py --live       # real BEP-20 deploy (needs tBNB)

Prerequisites:
  python scripts/register_genomes.py        # registers MOM + DAD genomes first
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

CONTESTANTS_FILE = ROOT / "content" / "contestants.json"


def main():
    mock = "--live" not in sys.argv
    contestants = json.loads(CONTESTANTS_FILE.read_text(encoding="utf-8"))
    addr_map = {c["ticker"]: c["token_address"] for c in contestants}

    mom_addr = addr_map.get("MOM")
    dad_addr = addr_map.get("DAD")

    if not mom_addr or not dad_addr:
        print("ERROR: MOM or DAD address not found in contestants.json")
        sys.exit(1)

    print(f"MOM address: {mom_addr}")
    print(f"DAD address: {dad_addr}")
    print(f"Deploy mode: {'--mock' if mock else 'LIVE (BNB testnet)'}\n")

    from backend.mating.mate import mate
    child = mate(mom_addr, dad_addr, mock_deploy=mock)

    print(f"\nChild genome written to content/genomes.json")
    print(f"Mating transcript in content/mating_transcript.json")
    print(f"contestants.json updated")


if __name__ == "__main__":
    main()
