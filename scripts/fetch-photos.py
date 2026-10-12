"""Download the demo product photos from Unsplash into public/seed.

Usage:  python3 scripts/fetch-photos.py
Needs network access to images.unsplash.com.

Photos are free to use under the Unsplash License (https://unsplash.com/license).
Each product type has a hand-picked list of Unsplash photo ids below (checked
by eye). The script crops each photo to 4:5, saves an optimised JPEG and
rewrites src/services/mock/seed/photos.ts and public/seed/CREDITS.md.
To change a photo, swap its id and run the script again.
"""

import io
import json
import pathlib
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "seed"
MANIFEST = ROOT / "src" / "services" / "mock" / "seed" / "photos.ts"

# Product type -> Unsplash photo ids (the part after "photo-" in images.unsplash.com URLs)
PHOTOS: dict[str, list[str]] = {
    "tee": [
        "1521572163474-6864f9cf17ab",
        "1583743814966-8936f5b7be1a",
        "1562157873-818bc0726f68",
        "1618354691373-d851c5c3a990",
        "1622445275463-afa2ab738c34",
        "1529374255404-311a2a4f1fd9",
        "1503341504253-dff4815485f1",
    ],
    "dress": [
        "1515372039744-b8f02a3ae446",
        "1572804013309-59a88b7e92f1",
        "1595777457583-95e059d581b8",
        "1539008835657-9e8e9680c956",
        "1496747611176-843222e1e57c",
    ],
    "cap": ["1588850561407-ed78c282e89b", "1521369909029-2afed882baee", "1575428652377-a2d80e2277fc"],
    "jacket": [
        "1551028719-00167b16eac5",
        "1544022613-e87ca75a784a",
        "1591047139829-d91aecb6caea",
        "1520975954732-35dd22299614",
        "1576871337622-98d48d1cf531",
    ],
    "sneaker": [
        "1525966222134-fcfa99b8ae77",
        "1491553895911-0055eca6402d",
        "1549298916-b41d501d3772",
        "1600185365483-26d7a4cc7519",
    ],
    "tote": [
        "1544816155-12df9643f363",
        "1590874103328-eac38a683ce7",
        "1622560480605-d83c853bc5c3",
        "1591561954557-26941169b49e",
    ],
    "bowl": [
        "1512058564366-18510be2db19",
        "1603133872878-684f208fb84b",
        "1585937421612-70a008356fbe",
        "1504674900247-0877df9cc836",
    ],
    "jar": ["1601049541289-9b1b7bbbfe19", "1611930022073-b7a4ba5fcccd", "1556228578-8c89e6adf883"],
    "cookie": [
        "1499636136210-6f4ee915583e",
        "1558961363-fa8fdf82db35",
        "1606313564200-e75d5e30476c",
        "1621236378699-8597faf6a176",
        "1590080875515-8a3a8dc5735e",
    ],
    "drink": [
        "1600271886742-f049cd451bba",
        "1556679343-c7306c1976bc",
        "1513558161293-cdaf765ed2fd",
        "1497534446932-c925b458314e",
        "1622597467836-f3285f2131b8",
    ],
    "bottle": ["1631729371254-42c2892f0e6e", "1556228578-8c89e6adf883"],
    "dropper": ["1608571423902-eed4a5ad8108", "1617897903246-719242758050"],
    "tube": ["1620916566398-39f1143ab7be", "1608248543803-ba4f8c70ae0b", "1556229010-6c3f2c9ca5f8"],
    "bracelet": [
        "1611591437281-460bfbe1220a",
        "1573408301185-9146fe634ad0",
        "1602173574767-37ac01994b2a",
        "1515562141207-7a88fb7ce338",
    ],
    "earring": ["1535632066927-ab7c9ab60908", "1617038220319-276d3cfab638", "1630019852942-f89202989a59"],
    "poster": [
        "1513519245088-0e12902e5a38",
        "1561214115-f2f134cc4912",
        "1579783902614-a3fb3927b6a5",
        "1582201942988-13e60e4556ee",
    ],
    "sticker": ["1572375992501-4b0892d50c69", "1597484661643-2f5fef640dd1"],
    "card": ["1597484661643-2f5fef640dd1", "1607344645866-009c320b63e0"],
    "earbuds": ["1606220945770-b5b6c2c55bf1", "1590658268037-6bf12165a8df", "1572569511254-d8f925fe2cbb"],
    "case": [
        "1601593346740-925612772716",
        "1592899677977-9c10ca588bbd",
        "1556656793-08538906a9f8",
        "1585060544812-6b45742d762f",
    ],
    "cable": ["1583863788434-e58a36330cf0"],
    "book": [
        "1512820790803-83ca734da794",
        "1495446815901-a7297e633e8d",
        "1544947950-fa07a98d237f",
        "1497633762265-9d179a990aa6",
        "1456513080510-7bf3a84b82f8",
        "1434030216411-0b793f4b4173",
    ],
    "candle": ["1602874801007-bd458bb1b8b6", "1603006905003-be475563bc59"],
}

W, H, QUALITY = 900, 1125, 78


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (kiosk demo seeder)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def crop(raw: bytes, out_w: int, out_h: int) -> Image.Image:
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    w, h = im.size
    target = out_w / out_h
    if w / h > target:
        nw = int(h * target)
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / target)
        im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    return im.resize((out_w, out_h), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.jpg"):
        old.unlink()
    manifest: dict[str, list[str]] = {}
    covers: dict[str, str] = {}
    credits: list[str] = []
    for motif, ids in PHOTOS.items():
        paths = []
        for i, pid in enumerate(ids, 1):
            name = f"{motif}-{i}.jpg"
            url = f"https://images.unsplash.com/photo-{pid}?w=1800&q=80&fm=jpg"
            try:
                raw = get(url)
                crop(raw, W, H).save(OUT / name, "JPEG", quality=QUALITY, optimize=True, progressive=True)

            except Exception as e:  # that slot keeps falling back to art
                print(f"  failed {name}: {e}")
                continue
            paths.append(f"/seed/{name}")
            credits.append(f"- `{name}`: https://images.unsplash.com/photo-{pid}")
        if paths:
            manifest[motif] = paths
            # Shop banner: a strip of four photos of this type (16:5, stays sharp)
            strip = Image.new("RGB", (1600, 500), "white")
            for k in range(4):
                tile = Image.open(ROOT / "public" / paths[k % len(paths)].lstrip("/")).resize((400, 500), Image.LANCZOS)
                strip.paste(tile, (k * 400, 0))
            strip.save(OUT / f"{motif}-banner.jpg", "JPEG", quality=QUALITY, optimize=True, progressive=True)
            covers[motif] = f"/seed/{motif}-banner.jpg"
        print(f"{motif}: {len(paths)}")

    src = MANIFEST.read_text()

    def replace_block(text: str, head: str, entries: dict) -> str:
        body = "".join(f"  {k}: {json.dumps(v)},\n" for k, v in entries.items())
        start = text.index(head)
        end = text.index("};", start) + 2
        return text[:start] + head + "\n" + body + "};" + text[end:]

    src = replace_block(src, "export const motifPhotos: Partial<Record<ArtMotif, readonly string[]>> = {", manifest)
    src = replace_block(src, "export const motifCovers: Partial<Record<ArtMotif, string>> = {", covers)
    MANIFEST.write_text(src)
    (OUT / "CREDITS.md").write_text(
        "# Photo credits\n\nDemo photos from [Unsplash](https://unsplash.com), used under the "
        "[Unsplash License](https://unsplash.com/license). Thank you to the photographers.\n\n"
        + "\n".join(credits)
        + "\n"
    )
    print(f"done: {sum(len(v) for v in manifest.values())} photos")


if __name__ == "__main__":
    main()
