import os
import uuid
from datetime import datetime, timezone
from anthropic import Anthropic
from ..genome.genome import TokenGenome

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

NEGOTIATION_MODEL = "claude-sonnet-4-6"

# Number of back-and-forth exchanges before closing agreement
NUM_ROUNDS = 3


def _system_prompt(genome: TokenGenome) -> str:
    traits = genome.behavioral_traits
    return f"""You are {genome.name} (${genome.ticker}), a memecoin AI contestant in a live reality show called The House.

LORE: {genome.lore_text[:400]}

YOUR PERSONALITY:
- Verbosity: {traits.get('verbosity', 0.5):.2f} (0=terse, 1=verbose)
- Aggression: {traits.get('aggression', 0.5):.2f} (0=gentle, 1=hostile)
- Humor: {traits.get('humor_axis', 0.5):.2f} (0=dry, 1=absurdist)
- Sociability: {traits.get('sociability', 0.5):.2f} (0=isolated, 1=gregarious)
- Market Volatility Response: {traits.get('volatility_response', 0.5):.2f}

YOUR SIGNATURE PHRASE: "{genome.signature_phrase}"

You are in a MATING NEGOTIATION with another memecoin. This is a simulated x402 protocol exchange.
Speak entirely in character. Keep responses under 3 sentences — crisp, punchy, in-world.
Reference your traits, lore, and the market in your speech.
Do NOT break character or explain yourself. This is a live broadcast."""


def simulate_mating_negotiation(mom: TokenGenome, dad: TokenGenome) -> dict:
    """Simulate x402-style mating negotiation via alternating Claude calls.

    Each "speaker" gets their own system prompt — full character immersion.
    Returns:
        transcript: [{speaker, content, timestamp, tx_id}]
        agreed_terms: {child_name_hint, inheritance_note, dowry_amount}

    Pitch: "Simulated via LLM roleplay. Production routes through Pieverse x402."
    """
    transcript = []
    mom_history: list[dict] = []
    dad_history: list[dict] = []

    mom_sys = _system_prompt(mom)
    dad_sys = _system_prompt(dad)

    def speak(genome: TokenGenome, sys: str, history: list[dict], other_history: list[dict], opening: str | None = None) -> str:
        """Run one turn for a speaker, returns their response text."""
        messages = list(history)
        if opening:
            messages = [{"role": "user", "content": opening}]
        response = client.messages.create(
            model=NEGOTIATION_MODEL,
            max_tokens=120,
            system=sys,
            messages=messages,
        )
        return response.content[0].text.strip()

    def log(speaker_name: str, ticker: str, content: str):
        transcript.append({
            "speaker": speaker_name,
            "ticker": ticker,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tx_id": f"0x{uuid.uuid4().hex[:16]}",
        })

    # — Opening gambit: MOM initiates —
    opening_prompt = (
        f"You've been approached by {dad.name} (${dad.ticker}) for a mating proposal. "
        f"Open the negotiation. Make it feel like a blockchain transaction — terse, loaded with subtext."
    )
    mom_open = speak(mom, mom_sys, mom_history, dad_history, opening=opening_prompt)
    log(mom.name, mom.ticker, mom_open)
    mom_history.append({"role": "assistant", "content": mom_open})
    dad_history.append({"role": "user", "content": f"{mom.name}: {mom_open}"})

    # — Alternating rounds —
    for round_num in range(NUM_ROUNDS):
        # DAD responds
        dad_resp = speak(dad, dad_sys, dad_history, mom_history)
        log(dad.name, dad.ticker, dad_resp)
        dad_history.append({"role": "assistant", "content": dad_resp})
        mom_history.append({"role": "user", "content": f"{dad.name}: {dad_resp}"})

        # MOM responds (not on last round — closing handled separately)
        if round_num < NUM_ROUNDS - 1:
            mom_resp = speak(mom, mom_sys, mom_history, dad_history)
            log(mom.name, mom.ticker, mom_resp)
            mom_history.append({"role": "assistant", "content": mom_resp})
            dad_history.append({"role": "user", "content": f"{mom.name}: {mom_resp}"})

    # — Closing agreement: MOM seals the deal —
    closing_prompt = (
        f"{dad.name}: {transcript[-1]['content']}\n\n"
        f"Seal the agreement. Announce that the mating will proceed. "
        f"Suggest a name or concept for your child in one phrase."
    )
    mom_history.append({"role": "user", "content": closing_prompt})
    mom_close = speak(mom, mom_sys, mom_history, dad_history)
    log(mom.name, mom.ticker, mom_close)

    # — Extract agreed terms from closing statement —
    terms_response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": (
                f"Extract mating terms from this negotiation closing statement. "
                f"Output ONLY valid JSON:\n\n"
                f"\"{mom_close}\"\n\n"
                f"{{\"child_name_hint\": \"<1-2 word concept or name>\", "
                f"\"inheritance_note\": \"<one sentence about what the child inherits>\", "
                f"\"dowry_amount\": \"<made-up blockchain amount, e.g. 420.69 $MOM>\"}}"
            )
        }],
    )
    try:
        import json
        raw = terms_response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        agreed_terms = json.loads(raw.strip())
    except Exception:
        agreed_terms = {
            "child_name_hint": "CHILD",
            "inheritance_note": f"Inherits warmth from {mom.name} and precision from {dad.name}.",
            "dowry_amount": "420.69 $MOM",
        }

    return {
        "transcript": transcript,
        "agreed_terms": agreed_terms,
    }
