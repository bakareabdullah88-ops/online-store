"""Download demo product photos from Unsplash into public/seed.

Usage:  python3 scripts/fetch-photos.py
Needs network access to unsplash.com and images.unsplash.com.

Photos are free to use under the Unsplash License (https://unsplash.com/license).
For each product type it searches Unsplash, keeps the top portrait-friendly
results, crops them to 4:5, saves optimised JPEGs, and rewrites
src/services/mock/seed/photos.ts plus public/seed/CREDITS.md.
"""

import io
import json
import pathlib
import time
import urllib.parse
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "seed"
MANIFEST = ROOT / "src" / "services" / "mock" / "seed" / "photos.ts"

# Product type -> (search query, how many photos)
QUERIES = {
    "tee": ("black man wearing t-shirt streetwear", 4),
    "dress": ("african print dress woman", 4),
    "cap": ("baseball cap fashion portrait", 3),
    "jacket": ("vintage denim jacket", 4),
    "sneaker": ("white sneakers", 3),
    "tote": ("canvas tote bag", 4),
    "bowl": ("jollof rice", 4),
    "jar": ("shea butter cream jar", 4),
    "cookie": ("chocolate chip cookies", 4),
    "drink": ("hibiscus drink bottle", 4),
    "bottle": ("skincare bottle product", 3),
    "dropper": ("serum dropper bottle", 3),
    "tube": ("sunscreen tube", 3),
    "bracelet": ("beaded bracelets", 4),
    "earring": ("gold earrings", 3),
    "poster": ("art poster frame wall", 4),
    "sticker": ("laptop stickers", 2),
    "card": ("greeting cards stationery", 3),
    "earbuds": ("wireless earbuds", 3),
    "case": ("phone case", 4),
    "cable": ("charging cable", 3),
    "book": ("stack of books", 6),
    "candle": ("scented candle", 2),
}

W, H, QUALITY = 900, 1125, 78


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (kiosk demo seeder)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def search(query: str, n: int) -> list[dict]:
    q = urllib.parse.urlencode({"query": query, "per_page": 20, "orientation": "portrait"})
    data = json.loads(get(f"https://unsplash.com/napi/search/photos?{q}"))
    # Skip Unsplash+ (paid) photos; keep free ones only.
    free = [p for p in data.get("results", []) if not p.get("premium") and not p.get("plus")]
    return free[:n]


def crop_4x5(raw: bytes) -> Image.Image:
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    w, h = im.size
    target = W / H
    if w / h > target:
        nw = int(h * target)
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / target)
        im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    return im.resize((W, H), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, list[str]] = {}
    credits: list[str] = []
    for motif, (query, n) in QUERIES.items():
        try:
            results = search(query, n)
        except Exception as e:  # keep going; that type keeps its art
            print(f"skip {motif}: {e}")
            continue
        paths = []
        for i, p in enumerate(results, 1):
            url = p["urls"]["raw"] + "&w=1400&q=80&fm=jpg"
            name = f"{motif}-{i}.jpg"
            try:
                crop_4x5(get(url)).save(OUT / name, "JPEG", quality=QUALITY, optimize=True, progressive=True)
            except Exception as e:
                print(f"  failed {name}: {e}")
                continue
            paths.append(f"/seed/{name}")
            user = p.get("user", {})
            credits.append(
                f"- `{name}`: {p.get('alt_description') or query} by "
                f"[{user.get('name', 'Unknown')}]({user.get('links', {}).get('html', '')}) on "
                f"[Unsplash]({p.get('links', {}).get('html', '')})"
            )
            time.sleep(0.2)
        if paths:
            manifest[motif] = paths
        print(f"{motif}: {len(paths)}")

    body = ",\n".join(f'  {k}: {json.dumps(v)}' for k, v in manifest.items())
    src = MANIFEST.read_text()
    start = src.index("export const motifPhotos")
    end = src.index("};", start) + 2
    MANIFEST.write_text(
        src[:start]
        + "export const motifPhotos: Partial<Record<ArtMotif, readonly string[]>> = {\n"
        + body
        + ",\n};"
        + src[end:]
    )
    (OUT / "CREDITS.md").write_text(
        "# Photo credits\n\nDemo photos from Unsplash, used under the "
        "[Unsplash License](https://unsplash.com/license).\n\n" + "\n".join(credits) + "\n"
    )
    print(f"done: {sum(len(v) for v in manifest.values())} photos")


if __name__ == "__main__":
    main()
