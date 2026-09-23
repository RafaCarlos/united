"""Encode responsive copies of approved artwork; never rewrite originals or HTML.

Run before optimize-static-assets.py. Consumers use seo/responsive-images.json,
whose keys are the current dist asset paths. Keep width/height on the image and
apply each row's srcset/sizes (or a context-specific sizes value). For a CSS
background, default_path is a safe same-dimension WebP replacement.

Only Pillow is required. No network, generative editing, cropping, or upscaling.
Content hashes in filenames let each generated copy be cached independently.
"""
from __future__ import annotations

from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
MANIFEST = ROOT / "seo/responsive-images.json"


def spec(source, widths, quality, sizes, *, usage="img", contexts=None, note=""):
    return dict(source=source, widths=widths, quality=quality, sizes=sizes,
                usage=usage, contexts=contexts or {}, note=note)


# Sizes describe CSS image geometry, not the clipped visible portion. In
# particular Jimmy/body is enlarged to 132% and the desktop hero is height-led.
PORTRAIT = "calc(100vw - 24px)"
WIDE = "calc((100svh - 74px) * 2)"
SPECS = {}
for name in ("institucional", "liveclass", "jimmy"):
    contexts = {"hero": {"media": "(max-width:768px)", "sizes": PORTRAIT}}
    if name == "jimmy":
        contexts["body"] = {
            "sizes": "(max-width:508px) calc((100vw - 90px) * 1.32), (max-width:768px) 554px, (max-width:1296px) 42vw, 554px",
            "selector": "#jimmy-united-idiomas img",
        }
    SPECS[f"assets/banners/{name}.webp"] = spec(
        f"assets/banners/{name}.png", [480, 768, 960, 1122], 90, PORTRAIT,
        contexts=contexts,
        note="Full approved portrait, including baked-in text; no cropping.")
    SPECS[f"assets/banners/{name}-wide.webp"] = spec(
        f"assets/banners/{name}-wide.png", [960, 1280, 1600, 1800], 90, WIDE,
        contexts={"hero": {"media": "(min-width:769px)", "sizes": WIDE}},
        note="Full approved wide composition; CSS controls the existing crop.")

SPECS.update({
    "assets/images/bg-cursos.png": spec(
        "assets/images/bg-cursos.png", [480, 768, 1280, 1924], 88, "100vw",
        usage="css-background", note=".about-home background-size:100% auto; preserve alpha."),
    "assets/images/storytelling-characters-3d.webp": spec(
        "assets/images/storytelling-characters-3d.png", [384, 640, 960, 1280, 1672], 88,
        "(max-width:1024px) calc(100vw - 40px), 20.4vw",
        note="Storytelling card becomes full width at 1024px; existing object-fit unchanged."),
    "assets/images/liveclass-conversation-2026.webp": spec(
        "assets/images/liveclass-conversation-2026.png", [480, 768, 1024, 1536], 88,
        "(max-width:380px) 368px, (max-width:467px) 428px, (max-width:768px) calc(100vw - 40px), (max-width:1296px) 72vw, 864px",
        note="Object-fit:cover keeps a 245/285px-tall mobile box; sizes accounts for the cover crop."),
    "assets/images/ondemand-devices-2026.webp": spec(
        "assets/images/ondemand-devices-2026.webp", [480, 768, 1024, 1280, 1672], 90,
        "(max-width:800px) calc((100vw - 40px) * 1.18), 67vw",
        note="WebP is the available approved source; keep full artwork and current 118%/125% sizing."),
})
for number, intrinsic_width in (("01", 392), ("02", 391), ("04", 388)):
    name = f"assets/images/img-plataforma-{number}.png"
    SPECS[name] = spec(name, [196, 320, 392], 92,
                       f"{intrinsic_width}px",
                       note="Use intrinsic width conservatively: height:100% and object-fit:cover can require more image pixels than the narrow figure width. Original PNG is at most 392px; never upscale or flatten alpha.")

# Native <video poster> has no srcset. Use these full-size copies in static
# HTML, with no late JS swap or duplicate poster request. The character poster
# remains untouched: full-size recompression saves only 2.8% of its 55,250 B.
for number in ("02", "03"):
    name = f"assets/images/video-united-idiomas-{number}-poster.webp"
    SPECS[name] = spec(
        name, [1280], 86,
        "(max-width:800px) calc(100vw - 88px), (max-width:1296px) 42vw, 528px",
        usage="video-poster",
        contexts={"home": {"selector": ".course-compact video"}},
        note="Same approved video frame, dimensions and full proportions. Use default_path in the native poster attribute; no responsive poster swapping. Other routes may display this video wider than the Home card.")


def digest(data):
    return sha256(data).hexdigest()


def main():
    manifest = {}
    previous = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    for current, cfg in SPECS.items():
        source_path = DIST / cfg["source"]
        source_bytes = source_path.read_bytes()
        with Image.open(source_path) as source:
            source.load()
            source = source.convert("RGBA" if "A" in source.getbands() else "RGB")
            source_width, source_height = source.size
            source_has_alpha = "A" in source.getbands()
            variants = []
            for width in sorted({min(width, source_width) for width in cfg["widths"]}):
                height = round(source_height * width / source_width)
                resized = source if width == source_width else source.resize(
                    (width, height), Image.Resampling.LANCZOS)
                output = BytesIO()
                resized.save(output, format="WEBP", quality=cfg["quality"],
                             method=6, alpha_quality=100, exact=True)
                data = output.getvalue()
                sha = digest(data)
                rel = Path(current).parent / "responsive" / f"{Path(current).stem}-{width}w-{sha[:12]}.webp"
                target = DIST / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                if not target.exists() or target.read_bytes() != data:
                    target.write_bytes(data)
                with Image.open(BytesIO(data)) as decoded:
                    assert decoded.size == resized.size, rel
                    alpha_exact = not source_has_alpha or (
                        decoded.convert("RGBA").getchannel("A").tobytes()
                        == resized.getchannel("A").tobytes())
                    assert alpha_exact, f"Alpha changed: {rel}"
                variants.append(dict(path=rel.as_posix(), width=width, height=height,
                                     bytes=len(data), sha256=sha, alpha_exact=alpha_exact))
            row = {
                "source": {"path": cfg["source"], "sha256": digest(source_bytes),
                           "bytes": len(source_bytes), "width": source_width,
                           "height": source_height, "mode": source.mode},
                "previous": {"path": current, "bytes": (DIST / current).stat().st_size,
                             "sha256": digest((DIST / current).read_bytes())},
                "encoding": {"format": "webp", "quality": cfg["quality"], "method": 6,
                             "resize": "Lanczos; proportional; no upscaling", "crop": "none"},
                "usage": cfg["usage"], "default_path": variants[-1]["path"],
                "variants": variants,
                "srcset": ", ".join(f"/{v['path']} {v['width']}w" for v in variants),
                "sizes": cfg["sizes"], "contexts": cfg["contexts"], "note": cfg["note"],
            }
            manifest[current] = row
            full = variants[-1]
            saved = 1 - full["bytes"] / row["previous"]["bytes"]
            print(f"{current}: {row['previous']['bytes']:,} → {full['bytes']:,} bytes at full width ({saved:.1%} reduction); {len(variants)} widths")
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    # Delete only stale files previously recorded by this generator, never
    # hand-authored assets or unrelated files in the responsive directories.
    active = {v["path"] for row in manifest.values() for v in row["variants"]}
    for row in previous.values():
        for variant in row.get("variants", []):
            rel = Path(variant["path"])
            if (rel.as_posix() not in active and not rel.is_absolute()
                    and ".." not in rel.parts and rel.parent.as_posix() in
                    {"assets/images/responsive", "assets/banners/responsive"}):
                (DIST / rel).unlink(missing_ok=True)
    print(f"Generated {sum(len(row['variants']) for row in manifest.values())} copies from {len(manifest)} approved assets.")


if __name__ == "__main__":
    main()
