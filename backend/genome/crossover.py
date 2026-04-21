import math
import random
import numpy as np
from .genome import TokenGenome


def inherit_trait(mom_value: float, dad_value: float, mutation_rate: float = 0.1) -> float:
    # Locked algorithm from TECHNICAL_DECISIONS.md §5 — do not change
    roll = random.random()
    if roll < 0.4:
        inherited = mom_value
    elif roll < 0.8:
        inherited = dad_value
    else:
        inherited = (mom_value + dad_value) / 2
    mutation = random.gauss(0, mutation_rate)
    return max(0.0, min(1.0, inherited + mutation))


def slerp_embeddings(v0: list[float], v1: list[float], t: float = 0.5) -> list[float]:
    """SLERP interpolation between two L2-normalized 1536D lore embeddings.
    t=0.5 for equal blend. Applies tiny Gaussian noise post-slerp for genetic uniqueness.
    """
    a = np.array(v0, dtype=np.float64)
    b = np.array(v1, dtype=np.float64)

    # Ensure unit vectors (OpenAI embeddings are normalized but be defensive)
    a = a / np.linalg.norm(a)
    b = b / np.linalg.norm(b)

    dot = float(np.clip(np.dot(a, b), -1.0, 1.0))
    theta = math.acos(abs(dot))  # abs: handle near-antipodal vectors gracefully

    if theta < 1e-6:
        # Nearly identical — linear interpolation is numerically safe
        result = (1 - t) * a + t * b
    else:
        sin_theta = math.sin(theta)
        result = (math.sin((1 - t) * theta) / sin_theta) * a + (math.sin(t * theta) / sin_theta) * b

    # Small genetic mutation: Gaussian noise on each dimension, then re-normalize
    noise = np.random.normal(0, 0.002, result.shape)
    result = result + noise
    result = result / np.linalg.norm(result)

    return result.tolist()


def crossover_genomes(mom: TokenGenome, dad: TokenGenome, terms: dict) -> TokenGenome:
    """Produce a child TokenGenome from two parents.
    terms comes from negotiation — can influence name_hint or trait weights.
    token_address and birth_block are filled after BEP-20 deploy.
    """
    # Blend lore embeddings via SLERP
    child_embedding: list[float] = []
    if mom.lore_embedding and dad.lore_embedding:
        child_embedding = slerp_embeddings(mom.lore_embedding, dad.lore_embedding, t=0.5)

    # Inherit all 5 behavioral traits stochastically
    trait_keys = ["verbosity", "aggression", "humor_axis", "sociability", "volatility_response"]
    child_traits: dict[str, float] = {}
    for key in trait_keys:
        m_val = mom.behavioral_traits.get(key, 0.5)
        d_val = dad.behavioral_traits.get(key, 0.5)
        child_traits[key] = inherit_trait(m_val, d_val)

    # Lore text placeholder — replaced by decode_genome_to_identity in mate.py
    child_lore = (
        f"Born from the union of {mom.name} and {dad.name}. "
        f"Carries the warmth of $MOM and the precision of $DAD. "
        f"Generation 1. The first child of The House."
    )

    child = TokenGenome(
        version="1.0",
        token_address="",           # filled after deploy
        name="",                    # filled by decode_genome_to_identity
        ticker="",                  # filled by decode_genome_to_identity
        lore_text=child_lore,
        lore_embedding=child_embedding,
        aesthetic_prompt="",        # filled by blend_aesthetic_prompts
        behavioral_traits=child_traits,
        parents=[mom.token_address, dad.token_address],
        generation=1,
        birth_block=0,              # filled after deploy
        genesis_archetype=None,
        signature_phrase="",        # filled by decode_genome_to_identity
    )
    return child
