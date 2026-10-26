"""Build the installable plugin and a commercial-only sitemap; never deploy."""
from pathlib import Path
import hashlib
import json
import xml.etree.ElementTree as ET
import zipfile

root = Path(__file__).resolve().parents[1]
plugin = root / "united-blog"
output = root / "releases"
output.mkdir(exist_ok=True)
archive = output / "United-Blog-WordPress-2026-10-24.zip"
files = sorted(p for p in plugin.rglob("*") if p.is_file() and not any(x.startswith(".") for x in p.relative_to(plugin).parts))
assert files and (plugin / "united-blog.php").is_file()
with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
    for source in files:
        entry = zipfile.ZipInfo("united-blog/" + source.relative_to(plugin).as_posix(), (2026, 10, 24, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        bundle.writestr(entry, source.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None

namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", namespace)
source_map = root.parent / "review/united-site-2026-10-21/dist/sitemap-united-pages.xml"
sitemap = ET.parse(source_map)
for url in list(sitemap.getroot()):
    location = url.find(f"{{{namespace}}}loc")
    if location is not None and "/blog/" in location.text:
        sitemap.getroot().remove(url)
locations = [node.text for node in sitemap.getroot().iter(f"{{{namespace}}}loc")]
assert len(locations) == 6 and all(url.startswith("https://www.unitedidiomas.com/") for url in locations)
ET.indent(sitemap, space="  ")
sitemap.write(output / "sitemap-united-pages.xml", encoding="UTF-8", xml_declaration=True)
report = {
    "pluginZip": archive.name,
    "bytes": archive.stat().st_size,
    "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
    "pluginFiles": len(files),
    "commercialSitemapUrls": locations,
    "blogSitemap": "Use the existing WordPress/SEO-plugin sitemap; no static article inventory.",
}
(output / "manifest.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(report, ensure_ascii=False, indent=2))
