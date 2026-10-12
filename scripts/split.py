# Split a tall screenshot into viewable chunks: python3 scripts/split.py <png> [chunk]
import sys
from PIL import Image
path = sys.argv[1]
chunk = int(sys.argv[2]) if len(sys.argv) > 2 else 1400
im = Image.open(path)
w, h = im.size
for i in range(0, h, chunk):
    out = path.replace(".png", f"-part{i // chunk}.png")
    im.crop((0, i, w, min(h, i + chunk))).save(out)
    print(out)
