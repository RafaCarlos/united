"""Import the complete public WordPress blog, keeping exact private source evidence.

Requires Python 3 and Pillow. Run from any directory:
    python3 tools/import-blog.py
Use --use-snapshots to reuse the API snapshots (image downloads still use a cache).
This only writes blog/content-source.json, blog/assets and blog/evidence. It does
not render public HTML, edit navigation, publish content, or execute source HTML.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
from html import unescape
from html.parser import HTMLParser
from io import BytesIO
import json
from pathlib import Path
import re
import shutil
import time
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
BLOG = ROOT / 'blog'
EVIDENCE = BLOG / 'evidence'
ASSETS = BLOG / 'assets'
CACHE = EVIDENCE / 'media-cache'
ENDPOINT = 'https://unitedidiomas.com/blog/wp-json/wp/v2/posts'
PAGE_SIZE = 100
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'Accept': 'application/json,text/html,image/avif,image/webp,*/*;q=0.8',
}


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def now():
    return datetime.now(timezone.utc).isoformat()


def fetch(url):
    error = None
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers=HEADERS), timeout=55) as response:
                return response.read(), {
                    'url': response.geturl(), 'status': response.status,
                    'headers': dict(response.headers), 'retrievedAt': now(),
                }
        except Exception as exc:
            error = exc
            if attempt < 2:
                time.sleep(attempt + 1)
    raise RuntimeError(f'{type(error).__name__}: {error}')


class Inspection(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.images, self.links, self.embeds, self.events = [], [], [], [], []
        self.tags = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags[tag] = self.tags.get(tag, 0) + 1
        self.parts.append(' ')
        if tag == 'img':
            self.images.append(attrs)
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag in ('iframe', 'script', 'object', 'embed', 'form', 'video', 'audio'):
            self.embeds.append({'tag': tag, 'attributes': attrs})
        self.events += [{'tag': tag, 'attribute': k} for k in attrs if k.startswith('on')]

    def handle_endtag(self, tag):
        self.parts.append(' ')

    def handle_data(self, text):
        self.parts.append(text)

    @property
    def text(self):
        return re.sub(r'\s+', ' ', unescape(''.join(self.parts))).strip()


def plain(value):
    parser = Inspection()
    parser.feed(value or '')
    return parser.text


def load_posts(use_snapshots):
    posts, snapshots, expected = [], [], None
    page, pages = 1, 1
    while page <= pages:
        url = f'{ENDPOINT}?per_page={PAGE_SIZE}&_embed=1&page={page}'
        destination = EVIDENCE / f'api-posts-page-{page}.json'
        header_path = EVIDENCE / f'api-posts-page-{page}.headers.json'
        if use_snapshots:
            raw = destination.read_bytes()
            headers = json.loads(header_path.read_text())
            info = {'url': url, 'status': 200, 'headers': headers,
                    'retrievedAt': datetime.fromtimestamp(destination.stat().st_mtime, timezone.utc).isoformat()}
        else:
            raw, info = fetch(url)
            headers = info['headers']
            destination.write_bytes(raw)
            dump(header_path, headers)
        normalized = {k.lower(): v for k, v in headers.items()}
        total = int(normalized['x-wp-total'])
        if expected is not None and total != expected:
            raise RuntimeError('Published post count changed during pagination; rerun import.')
        expected = total
        pages = int(normalized['x-wp-totalpages'])
        batch = json.loads(raw)
        assert isinstance(batch, list), 'Unexpected WordPress response'
        posts.extend(batch)
        snapshots.append({**info, 'file': str(destination.relative_to(BLOG)), 'posts': len(batch),
                          'sha256': hashlib.sha256(raw).hexdigest()})
        page += 1
    assert len(posts) == expected, (len(posts), expected)
    assert len({p['id'] for p in posts}) == expected, 'Duplicate post IDs'
    assert len({p['slug'] for p in posts}) == expected, 'Duplicate post slugs'
    assert len({p['link'] for p in posts}) == expected, 'Duplicate canonical URLs'
    assert all(p['status'] == 'publish' for p in posts)
    posts.sort(key=lambda p: (p['date'], p['id']), reverse=True)
    return posts, snapshots, expected


def image_metadata(media):
    details = media.get('media_details', {})
    sizes = {key: {'url': item['source_url'], 'width': item.get('width'), 'height': item.get('height')}
             for key, item in details.get('sizes', {}).items() if item.get('source_url')}
    return {'id': media['id'], 'url': media['source_url'], 'width': details.get('width'),
            'height': details.get('height'), 'alt': media.get('alt_text', ''),
            'caption': plain(media.get('caption', {}).get('rendered', '')), 'sizes': sizes}


def srcset_candidates(attrs, canonical):
    result = []
    for value in (attrs.get('srcset', ''), attrs.get('data-srcset', '')):
        for item in value.split(','):
            match = re.match(r'^\s*(\S+)\s+(\d+)w\s*$', item)
            if match:
                result.append({'url': urljoin(canonical, unescape(match[1])), 'width': int(match[2])})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--use-snapshots', action='store_true')
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    for directory in (EVIDENCE, ASSETS, CACHE):
        directory.mkdir(parents=True, exist_ok=True)
    manifest_path = BLOG / 'content-source.json'
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    previous_images = {a.get('localImage', {}).get('sourceUrl'): a.get('localImage')
                       for a in previous.get('articles', []) if a.get('localImage')}
    media_cache_path = EVIDENCE / 'media-import-cache.json'
    media_cache = json.loads(media_cache_path.read_text()) if media_cache_path.exists() else {}
    posts, snapshots, total = load_posts(args.use_snapshots)
    jobs, aliases, articles, inspections = {}, {}, [], []

    def register(source, urls, basename):
        urls = list(dict.fromkeys([source] + [u for u in urls if u]))
        key = next((aliases[u] for u in urls if u in aliases), source)
        if key not in jobs:
            jobs[key] = {'sourceUrl': source, 'sourceUrls': [], 'basename': basename}
        for url in urls:
            aliases[url] = key
            if url not in jobs[key]['sourceUrls']:
                jobs[key]['sourceUrls'].append(url)
        return key

    # Register original featured media first so identical body images reuse it.
    featured_keys, featured_metadata = {}, {}
    for post in posts:
        media = next((m for m in post.get('_embedded', {}).get('wp:featuredmedia', []) if m.get('source_url')), None)
        if not media:
            continue
        featured = image_metadata(media)
        featured_metadata[post['id']] = featured
        candidates = list(featured['sizes'].values()) + [featured]
        width, height = featured['width'], featured['height']
        if width and height:
            ratio = width / height
            candidates = [c for c in candidates if c.get('width') and c.get('height') and abs(c['width'] / c['height'] - ratio) < .015]
        adequate = [c for c in candidates if (c.get('width') or 0) >= 1200]
        source = min(adequate, key=lambda c: c['width']) if adequate else max(candidates, key=lambda c: c.get('width') or 0)
        safe_slug = re.sub(r'[^a-zA-Z0-9_-]', '-', post['slug'])
        featured_keys[post['id']] = register(source['url'], [c['url'] for c in candidates], safe_slug)

    for post in posts:
        raw_path = EVIDENCE / f"post-{post['id']}.json"
        html_path = EVIDENCE / f"post-{post['id']}.html"
        dump(raw_path, post)
        rendered = post['content']['rendered']
        html_path.write_text(rendered)
        inspection = Inspection()
        inspection.feed(rendered)
        embedded = post.get('_embedded', {})
        terms = [t for group in embedded.get('wp:term', []) for t in group if isinstance(t, dict)]
        def terms_for(kind):
            return [{'id': t['id'], 'name': unescape(t['name']), 'slug': t['slug'], 'url': t['link']}
                    for t in terms if t.get('taxonomy') == kind]
        excerpt = plain(post.get('excerpt', {}).get('rendered', ''))
        excerpt_words = excerpt.split()
        article = {
            'id': post['id'], 'title': plain(post['title']['rendered']), 'titleHtml': post['title']['rendered'],
            'canonicalUrl': post['link'], 'slug': post['slug'], 'date': post['date'], 'dateGmt': post.get('date_gmt'),
            'modified': post['modified'], 'modifiedGmt': post.get('modified_gmt'), 'status': post['status'],
            'categories': terms_for('category'), 'tags': terms_for('post_tag'),
            'excerpt': ' '.join(excerpt_words[:38]) + ('…' if len(excerpt_words) > 38 else ''),
            'excerptWordCount': min(38, len(excerpt_words)), 'excerptHtml': post.get('excerpt', {}).get('rendered', ''),
            'featuredImage': featured_metadata.get(post['id']), 'originalFeaturedMediaId': post.get('featured_media', 0),
            'authors': [{'id': a['id'], 'name': unescape(a['name']), 'url': a['link']} for a in embedded.get('author', []) if a.get('name')],
            'sourceUrl': f"{ENDPOINT}/{post['id']}",
            'privateContentEvidence': {'html': str(html_path.relative_to(BLOG)), 'postJson': str(raw_path.relative_to(BLOG)),
                                       'contentTextWordCount': len(inspection.text.split()),
                                       'htmlSha256': hashlib.sha256(rendered.encode()).hexdigest()},
            'inlineMedia': [],
        }
        for attrs in inspection.images:
            original = attrs.get('src') or attrs.get('data-src') or attrs.get('data-lazy-src')
            if not original:
                article['inlineMedia'].append({'kind': 'image', 'originalUrl': None, 'attributes': attrs,
                                               'externalFallback': True, 'error': 'Image has no source URL; exact HTML preserved.'})
                continue
            absolute = urljoin(post['link'], unescape(original))
            candidates = srcset_candidates(attrs, post['link'])
            candidates.append({'url': absolute, 'width': int(attrs.get('width', '0')) if attrs.get('width', '').isdigit() else 0})
            adequate = [c for c in candidates if c['width'] >= 1200]
            source = min(adequate, key=lambda c: c['width']) if adequate else max(candidates, key=lambda c: c['width'])
            urls = [original, absolute] + [c['url'] for c in candidates]
            media = {'kind': 'image', 'originalUrl': original, 'sourceUrls': list(dict.fromkeys(urls)),
                     'alt': attrs.get('alt', ''), 'attributes': attrs}
            if urlsplit(absolute).scheme not in ('http', 'https'):
                media.update(externalFallback=True, error='Non-HTTP image source remains in exact source HTML.')
            else:
                media['_key'] = register(source['url'], urls, 'inline-' + hashlib.sha256(absolute.encode()).hexdigest()[:16])
            article['inlineMedia'].append(media)
        article['_featuredKey'] = featured_keys.get(post['id'])
        if not article['_featuredKey']:
            fallback = next((m for m in article['inlineMedia'] if m.get('_key')), None)
            if fallback:
                article['_featuredKey'] = fallback['_key']
                article['listingImageSource'] = 'first-inline-image; original WordPress post has no featured media'
        inspections.append({'id': post['id'], 'slug': post['slug'], 'tags': inspection.tags,
                            'embeds': inspection.embeds, 'eventAttributes': inspection.events,
                            'shortcodes': sorted(set(re.findall(r'\[/?et_pb_[^\]\n]+\]', rendered))),
                            'links': inspection.links, 'images': len(inspection.images)})
        articles.append(article)

    def process_image(job):
        source = job['sourceUrl']
        existing = media_cache.get(source) or previous_images.get(source)
        if existing and all((BLOG / existing[k]).is_file() for k in ('large', 'thumb')):
            return {**existing, 'reused': True}
        digest = hashlib.sha256(source.encode()).hexdigest()
        cached_raw, cached_meta = CACHE / (digest + '.bin'), CACHE / (digest + '.json')
        if cached_raw.exists() and cached_meta.exists():
            data, status = cached_raw.read_bytes(), json.loads(cached_meta.read_text())
        else:
            data, status = fetch(source)
            cached_raw.write_bytes(data)
            dump(cached_meta, status)
        with Image.open(BytesIO(data)) as image:
            # Preserve animation rather than silently flattening an animated image.
            if getattr(image, 'is_animated', False):
                extension = (image.format or 'gif').lower()
                file = ASSETS / f"{job['basename']}.{extension}"
                file.write_bytes(data)
                relative = str(file.relative_to(BLOG))
                return {'large': relative, 'thumb': relative, 'width': image.width, 'height': image.height,
                        'thumbWidth': image.width, 'thumbHeight': image.height, 'largeBytes': len(data),
                        'thumbBytes': len(data), 'sourceUrl': source, 'sourceStatus': status['status'],
                        'format': extension, 'animationPreserved': True}
            original = ImageOps.exif_transpose(image)
            original = original.convert('RGBA' if 'A' in original.getbands() or 'transparency' in original.info else 'RGB')
            variants = []
            for maximum, suffix in ((1200, ''), (640, '-640')):
                width = min(original.width, maximum)
                height = max(1, round(original.height * width / original.width))
                output = original.resize((width, height), Image.Resampling.LANCZOS) if width != original.width else original.copy()
                path = ASSETS / f"{job['basename']}{suffix}.webp"
                output.save(path, format='WEBP', quality=82, method=6)
                variants.append((str(path.relative_to(BLOG)), width, height, path.stat().st_size))
        large, thumb = variants
        return {'large': large[0], 'thumb': thumb[0], 'width': large[1], 'height': large[2],
                'thumbWidth': thumb[1], 'thumbHeight': thumb[2], 'largeBytes': large[3], 'thumbBytes': thumb[3],
                'sourceUrl': source, 'sourceStatus': status['status'], 'format': 'webp', 'quality': 82,
                'originalWidth': original.width, 'originalHeight': original.height}

    print(f'Inventory complete: {total} posts; {len(jobs)} distinct image jobs; {sum(len(a["inlineMedia"]) for a in articles)} body images.', flush=True)
    failures, results = [], {}
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        tasks = {pool.submit(process_image, job): key for key, job in jobs.items()}
        for index, future in enumerate(as_completed(tasks), 1):
            key = tasks[future]
            try:
                results[key] = future.result()
                media_cache[key] = results[key]
            except Exception as exc:
                results[key] = {'externalFallback': True, 'sourceUrl': key, 'error': str(exc)}
                failures.append(results[key])
            if index % 10 == 0 or index == len(tasks):
                dump(media_cache_path, media_cache)
                print(f'Images: {index}/{len(tasks)}; failures: {len(failures)}', flush=True)
    for article in articles:
        key = article.pop('_featuredKey')
        if key:
            result = results[key]
            if result.get('externalFallback'):
                article['imageFallback'] = result
                article['localImage'] = None
            else:
                article['localImage'] = result
        else:
            article['localImage'] = None
        for media in article['inlineMedia']:
            key = media.pop('_key', None)
            if key:
                result = results[key]
                if result.get('externalFallback'):
                    media.update(result)
                else:
                    media['localImage'] = result
    completed = now()
    manifest = {
        'schemaVersion': 1, 'retrievedAt': snapshots[0]['retrievedAt'], 'preparedAt': completed,
        'sourceSite': 'https://unitedidiomas.com/blog/', 'sourceEndpoint': snapshots[0]['url'],
        'restAvailable': True, 'totalPublishedPosts': total, 'pagesAtRequestedPageSize': len(snapshots),
        'requestedPageSize': PAGE_SIZE, 'order': 'date descending, then ID descending',
        'responseHeaders': snapshots[0]['headers'], 'importComplete': True,
        'coverage': {'expected': total, 'imported': len(articles), 'uniqueIds': len({a['id'] for a in articles}),
                     'earliest': articles[-1]['date'], 'latest': articles[0]['date'], 'apiPages': len(snapshots)},
        'notes': [
            'All published posts from the public WordPress API are included; no date or category filter was used.',
            'Exact rendered source HTML and complete raw post JSON are retained privately under evidence; exclude this directory from builds.',
            'Source HTML, text, links, embeds, alt text and metadata are not modified or stripped by this importer.',
            'Dates retain the source WordPress fields; use the published calendar date for display.',
            'Listing excerpts are limited to 38 words; excerptHtml and full source content are preserved.',
            'Featured and inline images use deduplicated local WebP variants at quality 82, maximum 1200/640 pixels wide without upscaling or cropping.',
            'inlineMedia maps original URLs and srcset aliases to localImage; renderers must use the mapping while preserving body content.',
            'A post without featured media uses its first body image for listingImageSource only; featuredImage remains null.',
            'Unsuccessful media conversions retain an explicit original external fallback; no content is silently dropped.',
        ], 'articles': articles,
    }
    dump(manifest_path, manifest)
    dump(EVIDENCE / 'api-pagination.json', {'retrievedAt': completed, 'pages': snapshots})
    dump(EVIDENCE / 'post-url-map.json', [{'id': a['id'], 'canonicalUrl': a['canonicalUrl'], 'slug': a['slug'],
                                        'localPath': a['slug'] + '/'} for a in articles])
    dump(EVIDENCE / 'media-url-map.json', {url: {'sourceUrl': key, **results[key]} for url, key in sorted(aliases.items())})
    report = {'completedAt': completed, 'coverage': manifest['coverage'], 'articles': inspections,
              'imageJobs': len(jobs), 'imageReferences': sum(len(a['inlineMedia']) for a in articles),
              'imageFailures': failures, 'sourceStatuses': sorted(set(r.get('sourceStatus') for r in results.values() if r.get('sourceStatus'))),
              'missingFeaturedMedia': [a['id'] for a in articles if not a['originalFeaturedMediaId']],
              'localizedImages': sum(not r.get('externalFallback') for r in results.values()),
              'uniqueImageBytes': sum(r.get('largeBytes', 0) + r.get('thumbBytes', 0) for r in results.values()),
              'largestVariantBytes': max(max(r.get('largeBytes', 0), r.get('thumbBytes', 0)) for r in results.values()),
              'animatedImages': [r for r in results.values() if r.get('animationPreserved')]}
    dump(EVIDENCE / 'import-report.json', report)
    print(json.dumps({k: v for k, v in report.items() if k != 'articles'}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
