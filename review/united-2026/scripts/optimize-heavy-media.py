"""Rebuild the large video background from its original PNG, never from a WebP.

Requires Pillow and NumPy. The default source is the original asset in the Git
repository; a standalone review package can supply that PNG with --source.
Geometry and alpha are preserved, and quality is checked before writing output.
"""
import argparse
from hashlib import sha256
from io import BytesIO
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
KEY = 'assets/images/bg-united-video.png'
OUTPUT = 'assets/images/bg-united-video.webp'
SOURCE_SHA256 = 'b02b534ee6483f5acfa33b583d539448391c45b2dbf15bc9d6d0a6decb05736a'


def composite(image, background):
    canvas = Image.new('RGBA', image.size, background)
    canvas.alpha_composite(image)
    return np.asarray(canvas.convert('RGB'), dtype=np.float64)


def mean7(values):
    """Uniform 7x7 window, matching the conventional sample-covariance SSIM."""
    padded = np.pad(values, ((3, 3), (3, 3), (0, 0)), mode='reflect')
    summed = np.pad(padded, ((1, 0), (1, 0), (0, 0))).cumsum(0).cumsum(1)
    return (summed[7:, 7:] - summed[:-7, 7:] - summed[7:, :-7]
            + summed[:-7, :-7]) / 49


def quality_metrics(source, encoded, background):
    original, result = composite(source, background), composite(encoded, background)
    ux, uy = mean7(original), mean7(result)
    vx = (mean7(original * original) - ux * ux) * (49 / 48)
    vy = (mean7(result * result) - uy * uy) * (49 / 48)
    covariance = (mean7(original * result) - ux * uy) * (49 / 48)
    scores = ((2 * ux * uy + 6.5025) * (2 * covariance + 58.5225)
              / ((ux * ux + uy * uy + 6.5025) * (vx + vy + 58.5225)))
    mse = np.mean((original - result) ** 2)
    return float(scores[3:-3, 3:-3].mean()), float(10 * math.log10(255 ** 2 / mse))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT.parents[1] / KEY)
    args = parser.parse_args()
    if not args.source.is_file():
        parser.error('Original PNG is missing; supply --source. Existing WebP is never re-encoded.')
    source_bytes = args.source.read_bytes()
    if sha256(source_bytes).hexdigest() != SOURCE_SHA256:
        parser.error('PNG does not match the approved original; no output was changed.')
    with Image.open(BytesIO(source_bytes)) as image:
        source = image.convert('RGBA')
    output = BytesIO()
    source.save(output, format='WEBP', quality=94, method=6, exact=True)
    encoded_bytes = output.getvalue()
    with Image.open(BytesIO(encoded_bytes)) as image:
        encoded = image.convert('RGBA')
    if source.size != encoded.size or source.size != (1785, 1514):
        raise ValueError('Image dimensions changed.')
    if not np.array_equal(np.asarray(source)[:, :, 3], np.asarray(encoded)[:, :, 3]):
        raise ValueError('Transparency changed.')
    metrics = {background: quality_metrics(source, encoded, background)
               for background in ('white', 'black')}
    ssim, psnr = metrics['white']
    if len(encoded_bytes) > 500_000 or any(s < 0.98 or p < 45 for s, p in metrics.values()):
        raise ValueError(f'Quality/size threshold failed: {metrics}, {len(encoded_bytes)} bytes.')
    record_path = ROOT / 'seo/image-optimization.json'
    records = json.loads(record_path.read_text())
    records[KEY] = {
        'path': OUTPUT, 'before': len(source_bytes), 'after': len(encoded_bytes),
        'width': source.width, 'height': source.height, 'quality': 94,
        'ssim': ssim, 'psnr_db': psnr,
        'ssim_black_background': metrics['black'][0],
        'psnr_db_black_background': metrics['black'][1],
        'metric_method': 'RGB composited on white/black; SSIM 7x7 uniform, sample covariance',
        'alpha_exact': True, 'source_sha256': SOURCE_SHA256,
        'source_repository_path': KEY,
        'previous_webp_bytes': 1_423_198,
        'previous_webp_sha256': '60e672bc64a842ab219cc0f47c7b8ff8ec45dcd2acab7eaca32ddc4092c7569a',
    }
    (ROOT / 'dist' / OUTPUT).write_bytes(encoded_bytes)
    record_path.write_text(json.dumps(records, indent=2) + '\n')
    print(json.dumps(records[KEY], indent=2))


if __name__ == '__main__':
    main()
