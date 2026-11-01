"""Re-encode the approved mascot assets for the web; original PNG files stay intact.

Run from any directory: python web/scripts/prepare-raymond-assets.py
Authoring dependency: Pillow. Docker serves the committed WebP files directly.
"""

from pathlib import Path
from PIL import Image

web = Path(__file__).resolve().parents[1]
source = web.parent / "assets" / "mascot"
destination = web / "public" / "raymond"
destination.mkdir(parents=True, exist_ok=True)

assets = {"professor": (source / "candidates" / "01-sql-underviseren.png", 768)}
assets["neutral"] = (source / "professor-pack" / "head-neutral.png", 384)
for mood in ("success", "error", "help", "thinking", "warning", "celebration"):
    assets[mood] = (source / "professor-pack" / "feedback" / f"{mood}.png", 384)
for variant in ("summer-holiday", "fancy"):
    assets[variant] = (source / "professor-pack" / f"{variant}.png", 640)

for name, (path, max_size) in assets.items():
    with Image.open(path) as image:
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        output = destination / f"{name}.webp"
        image.save(output, "WEBP", quality=86, method=6, exact=True)
        print(f"{output.name}: {image.width}x{image.height}, {output.stat().st_size:,} bytes")
