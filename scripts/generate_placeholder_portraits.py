"""
Generate styled placeholder portraits for MOM, DAD, CHILD.
Run while waiting for Replicate billing to be set up.
Each portrait captures the color aesthetic of the character.

Output: frontend/public/portraits/{mom,dad,child}.png  (512x512)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math, random

OUT = Path(__file__).parent.parent / "frontend" / "public" / "portraits"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 512, 512


def radial_gradient(img: Image.Image, cx, cy, r, color_inner, color_outer):
    """Paint a radial gradient over the image."""
    px = img.load()
    for y in range(H):
        for x in range(W):
            d = math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / r
            t = min(d, 1.0)
            r_ = int(color_inner[0] * (1 - t) + color_outer[0] * t)
            g_ = int(color_inner[1] * (1 - t) + color_outer[1] * t)
            b_ = int(color_inner[2] * (1 - t) + color_outer[2] * t)
            px[x, y] = (r_, g_, b_)
    return img


def noise_overlay(img: Image.Image, amount: int = 18) -> Image.Image:
    """Add subtle analog grain."""
    rng = random.Random(42)
    px = img.load()
    for y in range(H):
        for x in range(W):
            n = rng.randint(-amount, amount)
            r_, g_, b_ = px[x, y]
            px[x, y] = (
                max(0, min(255, r_ + n)),
                max(0, min(255, g_ + n)),
                max(0, min(255, b_ + n)),
            )
    return img


def draw_scanlines(draw, alpha=18):
    for y in range(0, H, 3):
        draw.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))


def make_mom():
    # Sepia, warm amber — analog texture, vignette
    img = Image.new("RGB", (W, H))
    radial_gradient(img, W // 2, H // 2 - 40, 340, (210, 170, 100), (60, 38, 18))
    noise_overlay(img, 22)
    img = img.filter(ImageFilter.GaussianBlur(0.5))

    draw = ImageDraw.Draw(img, "RGBA")
    # Vignette
    for i in range(80):
        t = i / 80
        alpha = int(180 * t ** 2)
        draw.ellipse([i, i, W - i, H - i], outline=(20, 12, 4, alpha))

    # Initials silhouette
    draw.ellipse([W//2 - 70, 120, W//2 + 70, 280], fill=(150, 100, 50, 120))
    draw.rectangle([W//2 - 90, 275, W//2 + 90, 420], fill=(130, 85, 38, 110))

    # Ticker
    draw.text((W // 2 - 28, H - 72), "$MOM", fill=(230, 190, 110, 200))
    draw.text((W // 2 - 52, H - 48), "GEN 0 · SEED", fill=(180, 140, 80, 160))

    out = OUT / "mom.png"
    img.save(out, "PNG")
    print(f"[MOM] placeholder saved → {out}")


def make_dad():
    # Dark bg, neon teal/blue rims — cyberpunk clean
    img = Image.new("RGB", (W, H), (6, 8, 14))
    draw = ImageDraw.Draw(img, "RGBA")

    # Grid lines
    for x in range(0, W, 32):
        draw.line([(x, 0), (x, H)], fill=(20, 60, 80, 30))
    for y in range(0, H, 32):
        draw.line([(0, y), (W, y)], fill=(20, 60, 80, 30))

    # Rim-light glow (left: blue, right: teal)
    for i in range(60):
        t = 1 - i / 60
        alpha = int(120 * t ** 1.5)
        draw.rectangle([i, 0, i + 1, H], fill=(20, 100, 200, alpha))
        draw.rectangle([W - i - 1, 0, W - i, H], fill=(30, 200, 160, alpha))

    # Silhouette
    draw.ellipse([W//2 - 65, 110, W//2 + 65, 270], fill=(14, 20, 32, 200))
    draw.rectangle([W//2 - 85, 265, W//2 + 85, 420], fill=(12, 18, 30, 200))

    # Scan lines
    draw_scanlines(draw, 12)

    # Ticker
    draw.text((W // 2 - 28, H - 72), "$DAD", fill=(45, 212, 191, 200))
    draw.text((W // 2 - 52, H - 48), "GEN 0 · SEED", fill=(30, 150, 140, 160))

    out = OUT / "dad.png"
    img.save(out, "PNG")
    print(f"[DAD] placeholder saved → {out}")


def make_child():
    # Blended: warm amber + neon teal, violet tones
    img = Image.new("RGB", (W, H))
    radial_gradient(img, W // 2, H // 2, 300, (100, 60, 140), (20, 10, 35))
    noise_overlay(img, 14)

    draw = ImageDraw.Draw(img, "RGBA")
    # Dual rim
    for i in range(50):
        t = 1 - i / 50
        alpha = int(90 * t ** 1.5)
        draw.rectangle([i, 0, i + 1, H], fill=(200, 140, 60, alpha))
        draw.rectangle([W - i - 1, 0, W - i, H], fill=(100, 60, 200, alpha))

    # Silhouette placeholder
    draw.ellipse([W//2 - 60, 120, W//2 + 60, 265], fill=(80, 40, 110, 150))
    draw.rectangle([W//2 - 80, 260, W//2 + 80, 410], fill=(60, 30, 90, 140))

    draw.text((W // 2 - 44, H - 72), "$CHILD", fill=(180, 140, 240, 200))
    draw.text((W // 2 - 52, H - 48), "GEN 1 · BORN", fill=(140, 100, 200, 160))

    out = OUT / "child.png"
    img.save(out, "PNG")
    print(f"[CHILD] placeholder saved → {out}")


if __name__ == "__main__":
    print("Generating placeholder portraits...")
    make_mom()
    make_dad()
    make_child()
    print("\nDone. Replace with Replicate-generated portraits when billing is set up.")
    print("Run: python scripts/generate_portraits.py")
