"""Create smaller, pixel-identical WebP derivatives for remaining local rasters.

Only PNG/JPEG references used as images in the four HTML documents or declared
in their stylesheets are considered. CSS declarations can be overridden or
unused: the byte report is an asset inventory, never a page-transfer estimate.
Original images, metadata/share images, favicons, SVG and animated GIF stay
unchanged. Existing lossy/responsive encodings are never recompressed.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit

from lxml import html
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
RECORDS = ROOT / "seo/image-optimization.json"
OWNER = "optimize-remaining-images.py"
ROUTES = ("index.html", "cursos/index.html", "quem-somos/index.html", "faq/index.html")
RASTER = {".png", ".jpg", ".jpeg"}
CSS_URL = re.compile(r"url\(\s*['\"]?([^'\")]+)", re.I)


def digest(data):
    return sha256(data).hexdigest()


def local_path(value, relative="index.html"):
    if not value or value.startswith("data:"):
        return None
    url = urlsplit(urljoin("https://www.unitedidiomas.com/" + relative, value))
    if url.scheme not in {"http", "https"} or url.netloc not in {
        "www.unitedidiomas.com", "unitedidiomas.com"
    }:
        return None
    path = unquote(url.path).lstrip("/")
    candidate = DIST / path
    if candidate.is_symlink() or not candidate.resolve().is_relative_to(DIST.resolve()):
        raise ValueError("Unsafe image reference: " + path)
    return path


def references():
    result = defaultdict(set)
    sheets = set()

    def add(value, relative, usage):
        path = local_path(value, relative)
        # The entire brand directory is reserved for search/share compatibility.
        if path and path.startswith("assets/images/") and Path(path).suffix.lower() in RASTER:
            result[path].add(usage)

    def css(text, relative, usage):
        for value in CSS_URL.findall(text):
            add(value.strip(), relative, usage)

    for route in ROUTES:
        document = html.fromstring((DIST / route).read_bytes())
        for element in document.iter():
            tag = str(element.tag).rsplit("}", 1)[-1].lower()
            if tag in {"img", "image", "source"} or (
                tag == "input" and element.get("type", "").lower() == "image"
            ):
                for attribute in ("src", "href", "{http://www.w3.org/1999/xlink}href"):
                    add(element.get(attribute), route, "html-image:" + route)
                for candidate in element.get("srcset", "").split(","):
                    if candidate.strip():
                        add(candidate.split()[0], route, "html-candidate:" + route)
            if tag == "video":
                add(element.get("poster"), route, "html-poster:" + route)
            if tag == "link" and "stylesheet" in element.get("rel", "").split():
                path = local_path(element.get("href"), route)
                if path:
                    sheets.add(path)
            if element.get("style"):
                css(element.get("style"), route, "inline-css:" + route)
            if tag == "style":
                css(element.text or "", route, "inline-css:" + route)
        # Deliberately ignore links to review screenshots, favicon/preload links,
        # meta tags and JSON-LD. They are not ordinary displayed image elements.
    for sheet in sorted(sheets):
        css((DIST / sheet).read_text(), sheet, "css-declaration:" + sheet)
    return result


def encode(source_path):
    original = source_path.read_bytes()
    with Image.open(BytesIO(original)) as source:
        if getattr(source, "n_frames", 1) != 1:
            raise ValueError("Animated source is outside this optimizer's scope: " + str(source_path))
        source.load()
        rgba = source.convert("RGBA")
        metadata = {key: source.info[key] for key in ("icc_profile", "exif") if source.info.get(key)}
    output = BytesIO()
    rgba.save(output, format="WEBP", lossless=True, method=6, exact=True, **metadata)
    encoded = output.getvalue()
    with Image.open(BytesIO(encoded)) as decoded:
        if decoded.size != rgba.size or decoded.convert("RGBA").tobytes() != rgba.tobytes():
            raise ValueError("Dimensions or RGBA pixels changed: " + str(source_path))
    return original, encoded, rgba.size


def validate_owned(source, row):
    original = (DIST / source).read_bytes()
    target = DIST / row["path"]
    encoded = target.read_bytes()
    if digest(original) != row["source_sha256"] or digest(encoded) != row["sha256"]:
        raise ValueError("Image integrity drift: " + source)
    if len(original) != row["before"] or len(encoded) != row["after"]:
        raise ValueError("Image byte count drift: " + source)
    with Image.open(BytesIO(original)) as before, Image.open(BytesIO(encoded)) as after:
        if before.size != after.size or before.convert("RGBA").tobytes() != after.convert("RGBA").tobytes():
            raise ValueError("Image pixels differ: " + source)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify existing owned derivatives without writing.")
    args = parser.parse_args()
    records = json.loads(RECORDS.read_text())
    if args.check:
        owned = [(source, row) for source, row in records.items() if row.get("generator") == OWNER]
        for source, row in owned:
            validate_owned(source, row)
        print(json.dumps({"verified_lossless_derivatives": len(owned), "originals_unchanged": True}))
        return

    responsive = json.loads((ROOT / "seo/responsive-images.json").read_text())
    excluded = set()
    for source, row in records.items():
        excluded.update(filter(None, (local_path(source), local_path(row["path"]))))
    for source, row in responsive.items():
        excluded.update((source, row["source"]["path"], row["default_path"]))
        excluded.update(variant["path"] for variant in row["variants"])
    for source, row in records.items():
        if row.get("generator") == OWNER:
            validate_owned(source, row)

    additions = []
    larger = []
    for source, usages in sorted(references().items()):
        if source in excluded:
            continue
        source_path = DIST / source
        original, encoded, dimensions = encode(source_path)
        if len(encoded) >= len(original):
            larger.append(source)
            continue
        output = source_path.with_name(source_path.stem + "-lossless.webp")
        # Never overwrite an unrecorded existing derivative, even if its name fits.
        if output.exists() or output.is_symlink():
            raise ValueError("Unowned output already exists: " + str(output))
        row = {
            "path": output.relative_to(DIST).as_posix(),
            "before": len(original), "after": len(encoded),
            "width": dimensions[0], "height": dimensions[1],
            "lossless": True, "rgba_pixels_exact": True, "alpha_exact": True,
            "source_sha256": digest(original), "sha256": digest(encoded),
            "generator": OWNER, "references": sorted(usages),
            "usage_note": "Static reference inventory; CSS can be unused or overridden. Not measured page transfer.",
        }
        additions.append((source, output, original, encoded, row))
    # Finish every encode and validation before writing the derivatives/map.
    for source, output, original, encoded, row in additions:
        if (DIST / source).read_bytes() != original:
            raise ValueError("Original changed during conversion: " + source)
        output.write_bytes(encoded)
        records[source] = row
    if additions:
        RECORDS.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({
        "new_derivatives": len(additions),
        "source_bytes": sum(item[4]["before"] for item in additions),
        "webp_bytes": sum(item[4]["after"] for item in additions),
        "not_smaller_preserved": larger,
        "scope": "Referenced assets, including potentially unused CSS; not page-transfer savings.",
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
