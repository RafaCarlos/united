"""Explicitly refresh the integrity inventory after an intentional image replacement."""
from pathlib import Path
from hashlib import sha256
from PIL import Image
import json

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
records = {}
for file in sorted(dist.rglob('*')):
    if not file.is_file() or file.suffix.lower() not in {'.png','.jpg','.jpeg','.webp','.gif','.avif'}:
        continue
    with Image.open(file) as image:
        image.verify()
    with Image.open(file) as image:
        records[str(file.relative_to(dist))] = {'bytes':file.stat().st_size, 'dimensions':list(image.size), 'format':image.format, 'sha256':sha256(file.read_bytes()).hexdigest()}
report = {'scope':'All delivered raster assets, including source/reference images. No inferred compression baseline.', 'images':records}
(root / 'seo/image-inventory.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(f'Inventoried {len(records)} raster assets')
