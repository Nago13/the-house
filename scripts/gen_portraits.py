"""Generate portraits for 7 new contestants via Replicate Flux Schnell."""
import os, requests, json, sys
from pathlib import Path

REPLICATE_TOKEN = os.getenv("REPLICATE_API_TOKEN")
if not REPLICATE_TOKEN:
    sys.exit("REPLICATE_API_TOKEN not set")

PORTRAITS_DIR = Path(__file__).parent.parent / "frontend" / "public" / "portraits"

CONTESTANTS = [
    {
        "ticker": "shib",
        "prompt": "Portrait of a young woman with electric energy, surrounded by celebrating crowd, warm golden street photography light, motion blur suggesting collective movement, dog silhouettes integrated as shadows, candid photojournalism, bokeh crowd background, analog grain, joy mixed with defiance, orange gold tones",
    },
    {
        "ticker": "doge",
        "prompt": "Peaceful Shiba Inu dog portrait, warm afternoon golden light, lo-fi film grain, gentle vintage internet aesthetic, soft bokeh neighborhood street background, warm browns and amber tones, philosophical calm in the eyes, meme-legend quality, slightly worn photo edges, unbothered and timeless",
    },
    {
        "ticker": "pepe",
        "prompt": "Surreal digital portrait with deep greens and blacks, frog silhouette as shadow, RGB chromatic aberration aesthetic, underground art gallery quality, compressed internet artifact texture, ironic but intelligent expression, layers of meme culture as visual palimpsest, dark humor meets deep knowledge, ancient thing surviving in digital form",
    },
    {
        "ticker": "floki",
        "prompt": "Dramatic Viking warrior portrait, cinematic stormy sky with lightning, Norse rune carvings in foreground, powerful steel blue silver rim lighting, warrior in dark armor, nordic mythology meets blockchain, epic wide composition, documentary realism meets legend, the face of someone who has already decided they will win",
    },
    {
        "ticker": "pengu",
        "prompt": "Adorable penguin character with unnervingly intelligent eyes, soft Antarctic blues and whites, cute deceptive surface with calculating quality underneath, sophisticated elements incongruously integrated, small notebook, precise geometric shadows, cold crystalline ice environment, warm soft lighting revealing depth and precision on closer inspection",
    },
    {
        "ticker": "fartcoin",
        "prompt": "Maximalist absurdist art portrait, explosion of chartreuse green and sulfur yellow light, clouds rendered as golden light rays, everything slightly wrong in a beautiful way, cosmic gas as divine wind, surprisingly majestic composition, propaganda poster energy for pure nonsense, bold colors, somehow deeply compelling, the universe laughing at itself",
    },
    {
        "ticker": "phnix",
        "prompt": "Mythological phoenix portrait, deep ash grey at base transitioning to blazing oranges and crimsons rising, figure emerging from flame and smoke, ancient meets futuristic with runes and circuit traces in fire patterns, wings of living data streams, cinematic wide lighting, smoke rendered as fabric, rebirth as the central visual fact",
    },
]

def generate(ticker: str, prompt: str) -> str:
    out_path = PORTRAITS_DIR / f"{ticker}.png"
    if out_path.exists():
        print(f"  {ticker}.png already exists, skipping")
        return str(out_path)

    print(f"  Generating {ticker}.png ...")
    resp = requests.post(
        "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
        headers={
            "Authorization": f"Token {REPLICATE_TOKEN}",
            "Content-Type": "application/json",
        },
        json={"input": {"prompt": prompt, "num_outputs": 1}},
    )
    resp.raise_for_status()
    prediction = resp.json()
    pred_id = prediction["id"]

    import time
    for _ in range(60):
        time.sleep(3)
        poll = requests.get(
            f"https://api.replicate.com/v1/predictions/{pred_id}",
            headers={"Authorization": f"Token {REPLICATE_TOKEN}"},
        )
        poll.raise_for_status()
        data = poll.json()
        status = data["status"]
        if status == "succeeded":
            url = data["output"][0]
            img = requests.get(url)
            out_path.write_bytes(img.content)
            print(f"  Saved {ticker}.png ({len(img.content)//1024}KB)")
            return str(out_path)
        elif status in ("failed", "canceled"):
            print(f"  {ticker} FAILED: {data.get('error')}")
            return ""
    print(f"  {ticker} TIMEOUT")
    return ""

import time as _time

for i, c in enumerate(CONTESTANTS):
    if i > 0:
        print("  waiting 15s between requests...")
        _time.sleep(15)
    generate(c["ticker"], c["prompt"])

print("All done.")
