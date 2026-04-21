from dataclasses import dataclass, field


# TODO [Hours 1-4] — Implement full TokenGenome dataclass per TECHNICAL_DECISIONS.md §1
@dataclass
class TokenGenome:
    version: str = "1.0"
    token_address: str = ""
    name: str = ""
    ticker: str = ""
    lore_text: str = ""
    lore_embedding: list[float] = field(default_factory=list)  # 1536D, OpenAI text-embedding-3-small
    aesthetic_prompt: str = ""
    behavioral_traits: dict[str, float] = field(default_factory=dict)  # 5 traits only
    parents: list[str] = field(default_factory=list)  # token addresses; empty if genesis
    generation: int = 0
    birth_block: int = 0
    genesis_archetype: str | None = None
    signature_phrase: str = ""
