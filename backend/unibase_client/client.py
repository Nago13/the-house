"""
Membase client for The House.

Storage architecture:
  PRIMARY   → content/genomes.json  (local, never fails)
  SECONDARY → Membase hub           (async fire-and-forget, demo story)

Embeddings are kept separately in content/embeddings.json (too large for hub).

Why async for hub: the SDK has a bug where event.wait() hangs forever if the
upload returns a non-2xx response. We work around it by using wait=False.
"""
import json
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent.parent / ".env")

# Membase is optional — local JSON is primary storage.
# If SDK is unavailable (e.g. Railway build didn't install it), hub uploads are skipped gracefully.
try:
    from membase.memory.message import Message
    from membase.memory.serialize import serialize
    from membase.storage.hub import hub_client
    _MEMBASE_AVAILABLE = True
except ImportError:
    _MEMBASE_AVAILABLE = False
    print("[Membase] SDK not installed — hub uploads disabled, local JSON is primary.")

MEMBASE_ACCOUNT = os.getenv("MEMBASE_ACCOUNT", "the-house")

ROOT = Path(__file__).parent.parent.parent / "content"
GENOME_STORE_PATH = ROOT / "genomes.json"
EMBED_STORE_PATH  = ROOT / "embeddings.json"
CHAT_STORE_PATH   = ROOT / "chat_memory.json"

_genome_cache:    dict[str, dict]        = {}
_embedding_cache: dict[str, list[float]] = {}
_chat_cache:      dict[str, list[str]]   = {}


# ── Local store helpers ────────────────────────────────────────────────────

def _load(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}

def _save(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ── Hub helpers (fire-and-forget) ──────────────────────────────────────────

def _hub_upload(conversation_id: str, index: int, name: str, content: str,
                metadata: dict, msg_type: str = "profile") -> None:
    """Upload a message to Membase hub without blocking. No-ops if SDK unavailable."""
    if not _MEMBASE_AVAILABLE:
        return
    try:
        msg = Message(name=name, content=content, role="assistant",
                      metadata=metadata, type=msg_type)
        serialized = serialize(msg)
        filename = f"{conversation_id}_{index}"
        hub_client.upload_hub(MEMBASE_ACCOUNT, filename, serialized, wait=False)
    except Exception as e:
        print(f"[Membase] async upload warning (non-fatal): {e}")


# ── Genome ─────────────────────────────────────────────────────────────────

def write_genome(token_address: str, genome_dict: dict) -> bool:
    """
    Persist genome locally (primary) and async-upload to Membase hub (secondary).
    Strips lore_embedding from the hub payload (too large; stored separately).
    Always returns True — local write never fails silently.
    All keys stored lowercase for consistent lookup.
    """
    key = token_address.lower()

    # 1. Save embedding locally
    embedding = genome_dict.get("lore_embedding", [])
    if embedding:
        store = _load(EMBED_STORE_PATH)
        store[key] = embedding
        _save(EMBED_STORE_PATH, store)
        _embedding_cache[key] = embedding

    # 2. Save text genome locally
    hub_payload = {k: v for k, v in genome_dict.items() if k != "lore_embedding"}
    store = _load(GENOME_STORE_PATH)
    store[key] = hub_payload
    _save(GENOME_STORE_PATH, store)
    _genome_cache[key] = hub_payload

    # 3. Fire-and-forget upload to Membase hub
    _hub_upload(
        conversation_id=f"genome_{token_address}",
        index=0,
        name=genome_dict.get("ticker", token_address),
        content=json.dumps(hub_payload),
        metadata={"type": "profile", "token_address": token_address},
        msg_type="profile",
    )
    return True


def read_genome(token_address: str) -> dict | None:
    """Read genome. Checks in-process cache → local file → Membase hub.
    Always normalizes address to lowercase for consistent lookup.
    """
    key = token_address.lower()

    # 1. In-process cache
    if key in _genome_cache:
        genome = dict(_genome_cache[key])
        genome["lore_embedding"] = _get_embedding(key)
        return genome

    # 2. Local file
    store = _load(GENOME_STORE_PATH)
    if key in store:
        genome = dict(store[key])
        _genome_cache[key] = genome
        genome["lore_embedding"] = _get_embedding(key)
        return genome

    # 3. Membase hub (fallback)
    try:
        raw = hub_client.download_hub(MEMBASE_ACCOUNT, f"genome_{token_address}_0")
        if raw:
            outer = json.loads(raw.decode("utf-8"))
            msg_raw = outer.get("message", raw.decode("utf-8"))
            msg_dict = json.loads(msg_raw) if isinstance(msg_raw, str) else msg_raw
            genome = json.loads(msg_dict["content"])
            _genome_cache[token_address] = genome
            genome["lore_embedding"] = _get_embedding(token_address)
            return genome
    except Exception as e:
        print(f"[Membase] hub fallback failed for {token_address}: {e}")
    return None


def _get_embedding(token_address: str) -> list[float]:
    key = token_address.lower()
    if key not in _embedding_cache:
        store = _load(EMBED_STORE_PATH)
        _embedding_cache[key] = store.get(key, [])
    return _embedding_cache.get(key, [])


def get_embedding(token_address: str) -> list[float] | None:
    """Fast lookup of a stored embedding vector."""
    emb = _get_embedding(token_address.lower())
    return emb if emb else None


# ── Chat memory ────────────────────────────────────────────────────────────

def write_memory(token_address: str, user_id: str, content: str,
                 metadata: dict | None = None) -> bool:
    """Append a chat turn to local memory and async-upload to hub."""
    key = f"{token_address}:{user_id}"

    # Local
    store = _load(CHAT_STORE_PATH)
    store.setdefault(key, []).append(content)
    _save(CHAT_STORE_PATH, store)
    _chat_cache.setdefault(key, []).append(content)

    # Hub (async)
    index = len(store[key]) - 1
    meta = {"type": "chat", "user_id": user_id, "token_address": token_address}
    if metadata:
        meta.update(metadata)
    _hub_upload(
        conversation_id=f"chat_{token_address}_{user_id}",
        index=index,
        name=user_id,
        content=content,
        metadata=meta,
        msg_type="stm",
    )
    return True


def retrieve_top_memories(token_address: str, user_id: str, top_k: int = 5) -> list[str]:
    """Return the most recent top_k chat messages for this user/contestant pair."""
    key = f"{token_address}:{user_id}"
    if key not in _chat_cache:
        store = _load(CHAT_STORE_PATH)
        _chat_cache[key] = store.get(key, [])
    return _chat_cache[key][-top_k:]
