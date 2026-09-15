"""Crawl the four delivered pages and their local dependencies. No simulated Lighthouse score."""
from pathlib import Path
from collections import Counter
from urllib.parse import urlsplit, urljoin, unquote, parse_qs
from hashlib import sha256
from lxml import html, etree
from PIL import Image
import json, re

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / 'dist'
META = json.loads((ROOT / 'seo/metadata.json').read_text())
DOCS = {route: html.fromstring((D / route.strip('/') / 'index.html').read_bytes()) for route in META}
errors, warnings, pages = [], [], {}
checked_files = set()

def check(value, message):
    if not value: errors.append(message)

def dependency(value, route, label, fragment=False):
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or not value or value.startswith('data:'): return
    target = urljoin(route, unquote(parsed.path))
    file = D / target.lstrip('/')
    if file.is_dir(): file /= 'index.html'
    check(file.is_file(), f'{route}: {label} missing {target}')
    if file.is_file(): checked_files.add(str(file.relative_to(D)))
    if fragment and parsed.fragment and file.suffix == '.html' and file.exists():
        doc = html.fromstring(file.read_bytes())
        check(bool(doc.xpath('//*[@id=$id]', id=unquote(parsed.fragment))), f'{route}: broken fragment {value}')

for route, doc in DOCS.items():
    title = doc.xpath('string(/html/head/title)')
    description = doc.xpath('//meta[@name="description"]/@content')
    ids = Counter(doc.xpath('//*[@id]/@id'))
    check(len(doc.xpath('//h1')) == 1, f'{route}: requires one H1')
    check(title == META[route]['title'], f'{route}: title not applied')
    check(description == [META[route]['description']], f'{route}: missing/duplicate description')
    check(doc.get('lang') == 'pt-BR', f'{route}: language')
    check(doc.xpath('//link[@rel="canonical"]/@href') == ['https://www.unitedidiomas.com' + route], f'{route}: canonical')
    check(doc.xpath('//meta[@name="robots"]/@content') == ['noindex,nofollow'], f'{route}: private preview indexing protection')
    check(not doc.xpath('//meta[@name="keywords"]'), f'{route}: obsolete keyword stuffing tag')
    check(not [i for i, count in ids.items() if count > 1], f'{route}: duplicate IDs')
    for script in doc.xpath('//script[@type="application/ld+json"]'):
        graph = json.loads(script.text)['@graph']
        check(bool(graph), f'{route}: empty structured data')
    check(len(doc.xpath('//script[@type="application/ld+json"]')) == 1, f'{route}: structured data')
    check(len(doc.xpath('//link[@rel="stylesheet"]')) == 1, f'{route}: CSS bundle count')
    for e in doc.xpath('//*[@src or @href or @poster or @srcset]'):
        for attr in ['src', 'href', 'poster']:
            if e.get(attr): dependency(e.get(attr), route, e.tag+' '+attr, fragment=e.tag == 'a')
        if e.get('srcset') and not e.get('srcset').startswith('data:'):
            for item in e.get('srcset').split(','): dependency(item.strip().split()[0], route, 'srcset')
    for img in doc.xpath('//img'):
        check('alt' in img.attrib, f'{route}: image missing alt {img.get("src")}')
        if not img.get('src', '').endswith('.svg'):
            check(bool(img.get('width') and img.get('height')), f'{route}: image geometry missing {img.get("src")}')
    for v in doc.xpath('//video'):
        check('controls' not in v.attrib and 'autoplay' not in v.attrib, f'{route}: uncontrolled playback')
        check('playsinline' in v.attrib and 'muted' in v.attrib, f'{route}: inline playback')
        check(v.get('preload') == 'none', f'{route}: premature video download')
        check(bool(v.get('poster') and v.get('width') and v.get('height') and v.get('aria-label')), f'{route}: video poster/geometry/name')
        check('data-managed-video' in v.attrib, f'{route}: missing accessible playback enhancement')
        for source in v.xpath('./source'):
            check(source.get('src', '').startswith('/assets/videos/'), f'{route}: external video remains')
    for script in doc.xpath('//script[@src]'):
        check('defer' in script.attrib, f'{route}: parser-blocking script')
        url = urlsplit(script.get('src'))
        if not url.netloc and not url.scheme:
            file = D / urljoin(route, url.path).lstrip('/')
            check(parse_qs(url.query).get('v') == [sha256(file.read_bytes()).hexdigest()[:12]], f'{route}: stale script cache version {url.path}')
    for link in doc.xpath('//link[@rel="stylesheet"]'):
        file = D / urlsplit(link.get('href')).path.lstrip('/')
        css = file.read_text()
        for match in re.finditer(r'url\(([\"\']?)(.*?)\1\)', css): dependency(match.group(2), str(file.relative_to(D)), 'CSS url')
        check('.ttf' not in css, f'{route}: uncompressed font reference')
    pages[route] = {'title': title, 'description': description[0], 'h1': doc.xpath('//h1')[0].text_content(), 'images': len(doc.xpath('//img')), 'videos': len(doc.xpath('//video')), 'stylesheets': 1}

check(len(set(x['title'] for x in pages.values())) == len(pages), 'duplicate page titles')
faq = DOCS['/faq/']
questions = faq.xpath('//button[contains(@class,"faq-toggle")]/@aria-controls')
index = faq.xpath('//a[@data-faq-id]/@data-faq-id')
check(set(q.removesuffix('-answer') for q in questions) == set(index), 'FAQ index does not cover all questions')
check('Disallow: /' in (D / 'robots.txt').read_text(), 'private robots protection')
prod = ROOT / 'seo/production'
sitemap = etree.parse(str(prod / 'sitemap.xml'))
check(set(sitemap.xpath('//*[local-name()="loc"]/text()')) == {'https://www.unitedidiomas.com' + r for r in META}, 'production sitemap URLs')
check(not (D / 'sitemap.xml').exists(), 'production sitemap accidentally deployed to preview')
images = json.loads((ROOT / 'seo/image-optimization.json').read_text())
videos = json.loads((ROOT / 'seo/video-optimization.json').read_text())
fonts = json.loads((ROOT / 'seo/font-optimization.json').read_text())
def totals(rows):
    before, after = sum(r['before'] for r in rows), sum(r['after'] for r in rows)
    return {'original_bytes': before, 'optimized_bytes': after, 'reduction_percent': round((1-after/before)*100, 2)}
metrics = {
    'six_banner_assets': totals([r for k, r in images.items() if k.startswith('assets/banners/')]),
    'all_optimized_images': totals(list(images.values())),
    'six_previously_remote_videos': totals([{'before':r['original']['bytes'],'after':r['optimized']['bytes']} for k,r in videos.items() if k.startswith('https:')]),
    'local_fonts': totals(list(fonts.values()))
}
for r in images.values(): check((D / r['path']).stat().st_size == r['after'], 'image size record drift '+r['path'])
for r in videos.values(): check((D / r['path']).stat().st_size == r['optimized']['bytes'], 'video size record drift '+r['path'])
inventory = json.loads((ROOT / 'seo/image-inventory.json').read_text())
actual_images = {str(p.relative_to(D)) for p in D.rglob('*') if p.is_file() and p.suffix.lower() in {'.png','.jpg','.jpeg','.webp','.gif','.avif'}}
check(set(inventory['images']) == actual_images, 'image inventory coverage drift')
for name, record in inventory['images'].items():
    file = D / name
    check(file.is_file(), 'inventoried image missing '+name)
    if not file.is_file(): continue
    data = file.read_bytes()
    check(len(data) == record['bytes'] and sha256(data).hexdigest() == record['sha256'], 'image inventory content drift '+name)
    with Image.open(file) as image:
        check(list(image.size) == record['dimensions'], 'image inventory geometry drift '+name)
metrics['delivered_raster_image_inventory'] = {'files':len(inventory['images']), 'bytes':sum(r['bytes'] for r in inventory['images'].values()), 'note':'All stored raster assets, including reference/unused originals; not initial page transfer size or a compression baseline.'}
report = {'scope':'Private static preview; not a production crawl or Lighthouse score', 'pages':pages, 'local_dependencies_checked':len(checked_files), 'metrics':metrics, 'errors':errors, 'warnings':warnings,
          'unmeasured':['Lighthouse/PageSpeed score: not measured in this final review; an earlier API attempt returned HTTP 429','Production Core Web Vitals and Search Console indexing','Real-device Safari behavior','Server compression, cache headers and TTFB on the official host']}
(ROOT / 'seo/audit-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'pages':len(pages),'dependencies':len(checked_files),'errors':errors,'metrics':metrics}, ensure_ascii=False, indent=2))
raise SystemExit(bool(errors))
