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
RD_FORM_ID = 'lp-vamos-coversar-cbaf85f09c7f676d42c3'
RD_SDK = 'https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js'
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
    mounts = doc.xpath('//*[@data-rd-mount]')
    containers = doc.xpath('//*[@data-rd-contact]')
    check(len(mounts) == 1 and mounts[0].get('id') == RD_FORM_ID
          and len(doc.xpath('//*[@id=$id]', id=RD_FORM_ID)) == 1,
          f'{route}: requires exactly one official RD form mount')
    check(len(containers) == 1 and len(containers[0].xpath('.//*[@data-rd-mount]')) == 1
          and bool(containers[0].xpath('ancestor::*[@id="contato"]')),
          f'{route}: RD form must start in the inline contact section')
    check(not doc.xpath('//*[@id="formLead" or @id="formBar"]|//form[@data-preview-form]'),
          f'{route}: legacy demonstration form remains')
    scripts = doc.xpath('//script[@src]')
    sdk_scripts = [s for s in scripts if urlsplit(s.get('src')).path.endswith('/rdstation-forms.min.js')]
    init_scripts = [s for s in scripts if urlsplit(s.get('src')).path.split('/')[-1] == 'rdstation-form.js']
    check(len(sdk_scripts) == 1 and sdk_scripts[0].get('src') == RD_SDK,
          f'{route}: requires exactly one official RD SDK script')
    check(len(init_scripts) == 1, f'{route}: requires exactly one RD initialization script')
    if len(sdk_scripts) == 1 and len(init_scripts) == 1:
        init_url = urlsplit(init_scripts[0].get('src'))
        check(not init_url.scheme and not init_url.netloc
              and urljoin(route, unquote(init_url.path)) == '/rdstation-form.js',
              f'{route}: RD initialization must use the maintained local script')
        check(scripts.index(sdk_scripts[0]) < scripts.index(init_scripts[0]),
              f'{route}: RD SDK must precede initialization')
        check(all('defer' in s.attrib and 'async' not in s.attrib for s in [sdk_scripts[0], init_scripts[0]]),
              f'{route}: RD scripts require ordered deferred execution')
    check(not doc.xpath('//script[not(@src) and contains(text(), "RDStationForms")]'),
          f'{route}: inline RD initialization bypasses deferred SDK ordering')
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
            source_url = urlsplit(source.get('src', ''))
            source_path = urljoin(route, unquote(source_url.path))
            check(not source_url.scheme and not source_url.netloc and source_path.startswith('/assets/videos/'), f'{route}: external video remains')
    for script in doc.xpath('//script[@src]'):
        check('defer' in script.attrib, f'{route}: parser-blocking script')
        url = urlsplit(script.get('src'))
        if not url.netloc and not url.scheme:
            file = D / urljoin(route, url.path).lstrip('/')
            check(parse_qs(url.query).get('v') == [sha256(file.read_bytes()).hexdigest()[:12]], f'{route}: stale script cache version {url.path}')
    for link in doc.xpath('//link[@rel="stylesheet"]'):
        file = D / urljoin(route, unquote(urlsplit(link.get('href')).path)).lstrip('/')
        css = file.read_text()
        for match in re.finditer(r'url\(([\"\']?)(.*?)\1\)', css): dependency(match.group(2), str(file.relative_to(D)), 'CSS url')
        check('.ttf' not in css, f'{route}: uncompressed font reference')
    pages[route] = {'title': title, 'description': description[0], 'h1': doc.xpath('//h1')[0].text_content(), 'images': len(doc.xpath('//img')), 'videos': len(doc.xpath('//video')), 'stylesheets': 1}

check(len(set(x['title'] for x in pages.values())) == len(pages), 'duplicate page titles')
thanks_path = D / 'obrigado/index.html'
check(thanks_path.is_file(), 'local RD return page is missing')
if thanks_path.is_file():
    checked_files.add('obrigado/index.html')
    thanks = html.fromstring(thanks_path.read_bytes())
    thanks_robots = thanks.xpath('//meta[@name="robots"]/@content')
    check(len(thanks_robots) == 1 and {value.strip().lower() for value in thanks_robots[0].split(',')} == {'noindex', 'nofollow'},
          'RD return page must retain private preview indexing protection')
    check(not thanks.xpath('//form|//*[@data-rd-contact or @data-rd-mount or @id=$id]', id=RD_FORM_ID),
          'RD return page must not mount another lead form')
    check(not thanks.xpath('//script[contains(@src,"rdstation") or contains(text(),"RDStationForms")]'),
          'RD return page must not initialize RD again')
    for element in thanks.xpath('//*[@href or @src or @poster or @srcset]'):
        for attr in ['href', 'src', 'poster']:
            value = element.get(attr)
            if value:
                parsed = urlsplit(value)
                if not parsed.scheme and not parsed.netloc:
                    check(not value.startswith('/'), 'RD return page local links must support subdirectories')
                dependency(value, '/obrigado/', 'return page ' + attr, fragment=element.tag == 'a')
        if element.get('srcset') and not element.get('srcset').startswith('data:'):
            for item in element.get('srcset').split(','):
                dependency(item.strip().split()[0], '/obrigado/', 'return page srcset')
    for style in thanks.xpath('//style/text()|//*[@style]/@style'):
        for match in re.finditer(r'url\(([\"\']?)(.*?)\1\)', style):
            dependency(match.group(2), '/obrigado/', 'return page inline CSS')
faq = DOCS['/faq/']
faq_search = faq.xpath('//form[.//input[@id="busca" and @name="busca"]]')
check(len(faq_search) == 1 and bool(faq_search[0].xpath('.//button[@id="btnBuscar" and @type="submit"]')),
      'FAQ search form must remain independent of RD contact')
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
