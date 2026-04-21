import json
import math
import os
import subprocess
import time
from pathlib import Path

from ..genome.genome import TokenGenome
from ..genome.embedding import get_lore_embedding, decode_genome_to_identity, blend_aesthetic_prompts
from ..genome.crossover import crossover_genomes
from ..unibase_client.client import read_genome, write_genome, get_embedding
from .negotiation import simulate_mating_negotiation

CONTENT_DIR = Path(__file__).parent.parent.parent / "content"
SCRIPTS_DIR = Path(__file__).parent.parent.parent / "scripts"
PORTRAITS_DIR = Path(__file__).parent.parent.parent / "frontend" / "public" / "portraits"


def _genome_from_dict(d: dict) -> TokenGenome:
    """Reconstruct a TokenGenome from the stored dict (genomes.json format)."""
    return TokenGenome(
        version=d.get("version", "1.0"),
        token_address=d.get("token_address", ""),
        name=d.get("name", ""),
        ticker=d.get("ticker", ""),
        lore_text=d.get("lore_text", ""),
        lore_embedding=d.get("lore_embedding", []),
        aesthetic_prompt=d.get("aesthetic_prompt", ""),
        behavioral_traits=d.get("behavioral_traits", {}),
        parents=d.get("parents", []),
        generation=d.get("generation", 0),
        birth_block=d.get("birth_block", 0),
        genesis_archetype=d.get("genesis_archetype"),
        signature_phrase=d.get("signature_phrase", ""),
    )


def check_compatibility(mom: TokenGenome, dad: TokenGenome) -> float:
    """Cosine similarity between lore embeddings. Returns 0.0–1.0."""
    a, b = mom.lore_embedding, dad.lore_embedding
    if not a or not b:
        return 0.5  # neutral if embeddings missing
    dot = sum(x * y for x, y in zip(a, b))
    # Embeddings are already L2-normalized — dot product IS cosine similarity
    # Clamp to [0,1] for display (similarity, not distance)
    return max(0.0, min(1.0, (dot + 1.0) / 2.0))


def generate_portrait(aesthetic_prompt: str, ticker: str) -> str:
    """Generate a portrait via Replicate (Flux Schnell) and return a local path.
    Falls back to placeholder composite if Replicate is unavailable.
    """
    try:
        import replicate
        import requests

        model = "black-forest-labs/flux-schnell"
        prompt = (
            f"Professional portrait photograph. {aesthetic_prompt}. "
            f"High detail, cinematic lighting, editorial quality. "
            f"NOT a cartoon or illustration — photorealistic."
        )
        output = replicate.run(
            model,
            input={
                "prompt": prompt,
                "num_inference_steps": 4,
                "guidance": 3.5,
                "width": 768,
                "height": 1024,
                "seed": 888,
                "output_format": "png",
                "output_quality": 95,
            }
        )
        img_url = str(output[0]) if isinstance(output, list) else str(output)
        img_bytes = requests.get(img_url, timeout=30).content
        out_path = PORTRAITS_DIR / f"{ticker.lower()}.png"
        out_path.write_bytes(img_bytes)
        print(f"[portrait] Generated via Replicate -> {out_path}")
        return f"/portraits/{ticker.lower()}.png"

    except Exception as e:
        print(f"[portrait] Replicate failed ({e}) — using placeholder child.png")
        return "/portraits/child.png"


def mate(mom_addr: str, dad_addr: str, mock_deploy: bool = True) -> TokenGenome:
    """Full mating pipeline — the star of the live demo.

    Steps:
      1. Load genomes from local storage
      2. Check lore compatibility (cosine similarity)
      3. Simulate x402-style negotiation → transcript + agreed_terms
      4. Crossover genomes (SLERP embeddings + stochastic trait inheritance)
      5. Blend aesthetic prompts
      6. Generate child identity (Claude Haiku)
      7. Embed child lore
      8. Deploy child BEP-20 (--mock by default until tBNB arrives)
      9. Generate child portrait
     10. Register child genome in storage
     11. Return child TokenGenome
    """
    print("\n=== THE HOUSE: MATING PIPELINE ===\n")

    # 1. Load parent genomes
    print("[1/11] Loading parent genomes...")
    mom_dict = read_genome(mom_addr)
    dad_dict = read_genome(dad_addr)
    if not mom_dict or not dad_dict:
        raise ValueError(f"Could not load genomes for {mom_addr} / {dad_addr}. Run genome registration first.")

    # Attach embeddings (stored separately)
    mom_dict["lore_embedding"] = get_embedding(mom_addr) or []
    dad_dict["lore_embedding"] = get_embedding(dad_addr) or []

    mom = _genome_from_dict(mom_dict)
    dad = _genome_from_dict(dad_dict)
    print(f"   MOM: {mom.name} ({mom.ticker})")
    print(f"   DAD: {dad.name} ({dad.ticker})")

    # 2. Compatibility check
    print("[2/11] Checking lore compatibility...")
    compat = check_compatibility(mom, dad)
    print(f"   Compatibility score: {compat:.3f} (cosine similarity, normalized to [0,1])")
    if compat < 0.1:
        print("   [WARNING] Very low compatibility — child may be chaotic")

    # 3. Simulate mating negotiation
    print("[3/11] Simulating mating negotiation (Claude Sonnet)...")
    negotiation = simulate_mating_negotiation(mom, dad)
    transcript = negotiation["transcript"]
    agreed_terms = negotiation["agreed_terms"]
    print(f"   {len(transcript)} exchanges completed")
    print(f"   Agreed terms: {agreed_terms}")

    # Save transcript
    transcript_path = CONTENT_DIR / "mating_transcript.json"
    transcript_path.write_text(
        json.dumps({"transcript": transcript, "agreed_terms": agreed_terms}, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    print(f"   Transcript saved -> {transcript_path}")

    # 4. Crossover genomes
    print("[4/11] Crossing over genomes...")
    child = crossover_genomes(mom, dad, agreed_terms)
    print(f"   Traits: {child.behavioral_traits}")

    # 5. Blend aesthetic prompts
    print("[5/11] Blending aesthetic prompts (Claude Haiku)...")
    child.aesthetic_prompt = blend_aesthetic_prompts(mom.aesthetic_prompt, dad.aesthetic_prompt)
    print(f"   Child aesthetic: {child.aesthetic_prompt[:80]}...")

    # 6. Generate child identity
    print("[6/11] Decoding child identity (Claude Haiku)...")
    name_hint = agreed_terms.get("child_name_hint", "")
    identity = decode_genome_to_identity(
        lore_text=child.lore_text,
        behavioral_traits=child.behavioral_traits,
        aesthetic_prompt=child.aesthetic_prompt,
        parent_names=[mom.name, dad.name],
    )
    child.name = identity["name"]
    child.ticker = identity["ticker"]
    child.signature_phrase = identity["signature_phrase"]
    # Update lore_text with a richer version using the actual name
    child.lore_text = (
        f"{child.name} (${child.ticker}) emerged from the union of {mom.name} and {dad.name}. "
        f"{identity['tagline']} "
        f"Generation 1. First child of The House."
    )
    print(f"   Identity: {child.name} / ${child.ticker}")
    print(f"   Tagline: {identity['tagline']}")

    # 7. Embed child lore
    print("[7/11] Embedding child lore...")
    child.lore_embedding = get_lore_embedding(child.lore_text)
    print(f"   Embedding dims: {len(child.lore_embedding)}")

    # 8. Deploy child BEP-20
    print(f"[8/11] Deploying child token ({'--mock' if mock_deploy else 'LIVE'})...")
    deploy_cmd = ["node", str(SCRIPTS_DIR / "deploy_token.js"), f"{child.name}COIN", child.ticker]
    if mock_deploy:
        deploy_cmd.append("--mock")
    result = subprocess.run(deploy_cmd, capture_output=True, text=True, cwd=str(SCRIPTS_DIR.parent))
    if result.returncode != 0:
        print(f"   [WARNING] Deploy script error: {result.stderr[:200]}")
        # Fallback: generate mock address inline
        import hashlib
        h = hashlib.sha256(f"HOUSE_TOKEN_{child.ticker}".encode()).hexdigest()
        child.token_address = "0x" + h[:40]
        print(f"   Fallback mock address: {child.token_address}")
    else:
        # Parse address directly from deploy script stdout
        import re
        for line in result.stdout.splitlines():
            print(f"   Deploy: {line.strip()}")
            match = re.search(r'0x[0-9a-fA-F]{40}', line)
            if match and not child.token_address:
                child.token_address = match.group(0)
        # Fallback: check if contestants.json was updated
        if not child.token_address:
            contestants_path = CONTENT_DIR / "contestants.json"
            cs = json.loads(contestants_path.read_text(encoding="utf-8"))
            for c in cs:
                if c.get("ticker") == child.ticker:
                    child.token_address = c.get("token_address", "")
                    break
        # Final fallback: generate mock address inline
        if not child.token_address:
            import hashlib
            h = hashlib.sha256(f"HOUSE_TOKEN_{child.ticker}".encode()).hexdigest()
            child.token_address = "0x" + h[:40]
    print(f"   Child address: {child.token_address}")

    # 9. Generate portrait
    print("[9/11] Generating child portrait...")
    portrait_url = generate_portrait(child.aesthetic_prompt, child.ticker)
    print(f"   Portrait: {portrait_url}")

    # 10. Register child genome
    print("[10/11] Registering child genome in storage...")
    child_dict = {
        "version": child.version,
        "token_address": child.token_address,
        "name": child.name,
        "ticker": child.ticker,
        "lore_text": child.lore_text,
        "aesthetic_prompt": child.aesthetic_prompt,
        "behavioral_traits": child.behavioral_traits,
        "parents": child.parents,
        "generation": child.generation,
        "birth_block": child.birth_block,
        "genesis_archetype": child.genesis_archetype,
        "signature_phrase": child.signature_phrase,
        "lore_embedding": child.lore_embedding,
    }
    success = write_genome(child.token_address, child_dict)
    print(f"   Storage write: {'OK' if success else 'FAILED'}")

    # Update contestants.json with full child data
    _update_contestants_json(child, portrait_url)

    print("\n[11/11] MATING COMPLETE")
    print(f"\n{'='*40}")
    print(f"  CHILD BORN: {child.name} (${child.ticker})")
    print(f"  Address:    {child.token_address}")
    print(f"  Generation: {child.generation}")
    print(f"  Signature:  \"{child.signature_phrase}\"")
    print(f"{'='*40}\n")

    return child


def _update_contestants_json(child: TokenGenome, portrait_url: str):
    """Update content/contestants.json with the new child entry."""
    contestants_path = CONTENT_DIR / "contestants.json"
    contestants = json.loads(contestants_path.read_text(encoding="utf-8"))

    # Remove stale DEPLOY_PENDING entries and any prior entry with same ticker
    contestants = [
        c for c in contestants
        if c.get("token_address") != "DEPLOY_PENDING" and c.get("ticker") != child.ticker
    ]

    child_entry = {
        "token_address": child.token_address,
        "name": child.name,
        "ticker": child.ticker,
        "generation": child.generation,
        "lore_text": child.lore_text,
        "aesthetic_prompt": child.aesthetic_prompt,
        "behavioral_traits": child.behavioral_traits,
        "parents": child.parents,
        "genesis_archetype": None,
        "signature_phrase": child.signature_phrase,
        "portrait_url": portrait_url,
    }
    contestants.append(child_entry)
    contestants_path.write_text(json.dumps(contestants, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"   contestants.json updated with {child.name}")
